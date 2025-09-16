// Handlers for prompt + challenge pairing

const Prompt = require("../../models/Prompt");
const Challenge = require("../../models/Challenge");

// keep only one active prompt flag true
//turns off all others and enables the given on flag

// helper to normalize dates to the midnight UTC
function toUtcMidnight(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

async function syncPromptActiveFlag(activePromptId) {
  //clear flag at all other prompts
  await Prompt.updateMany(
    { _id: { $ne: activePromptId }, is_active: true },
    { $set: { is_active: false } }
  );

  // Ensure that needed prompt is true

  await Prompt.updateOne(
    { _id: activePromptId },
    { $set: { is_active: true } }
  );
}

// helper to compute current UTC week (Sun 00:00 → next Sun 00:00)
function getCurrentWeekWindowUTC(now = new Date()) {
  const utcDay = now.getUTCDay(); // 0 = Sunday
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - utcDay, // back to Sunday
      0,
      0,
      0,
      0
    )
  );
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
  return { start, end };
}

// Function for both: endpoint and CRON
// priority = dates in 'challenge'
// find challenge covering the current week window
// if found -> find its prompt_id and return
// if not found -> create a challenge for this week with a picked prompt,
// then sync flags and return that prompt
async function runPromptSync(now = new Date()) {
  // 1) Week window (UTC)
  const { start, end } = getCurrentWeekWindowUTC(now);
  const normStart = toUtcMidnight(start);
  const normEnd = toUtcMidnight(end);

  // 2) Find challenge covering this week
  let activeChallenge = await Challenge.findOne({
    start_date: normStart,
    end_date: normEnd,
  }).populate({
    path: "prompt_id",
    select: "title description rules is_active",
  });

  // 3) If no challenge -> reset active prompt from last week, create a challenge with a RANDOM not-active prompt
  if (!activeChallenge) {
    await Prompt.updateMany(
      { is_active: true },
      { $set: { is_active: false } }
    ); // reset an old active flag

    const candidates = await Prompt.aggregate([
      { $match: { is_active: false } },
      { $sample: { size: 1 } },
    ]);

    let promptIdToUse = candidates[0]?._id;

    if (!promptIdToUse) {
      const any = await Prompt.aggregate([{ $sample: { size: 1 } }]);
      promptIdToUse = any[0]?._id;
    }
    if (!promptIdToUse) {
      // if there are no prompts at all in DB
      return { message: "No active challenge" };
    }

    const created = await Challenge.findOneAndUpdate(
      { start_date: normStart, end_date: normEnd },
      {
        $setOnInsert: {
           start_date: normStart, 
           end_date: normEnd, 
          prompt_id: promptIdToUse,
          artworks: [],
          participants: [],
        },
        $set: { prompt_id: promptIdToUse },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // re-population for consistent response shape
    activeChallenge = await Challenge.findById(created._id).populate({
      path: "prompt_id",
      select: "title description rules is_active",
    });
  }

  // 4) Safety
  if (!activeChallenge || !activeChallenge.prompt_id) {
    return { message: "No active challenge" };
  }

  // 5) Sync flags: only this prompt must be active
  const p = activeChallenge.prompt_id;
  await syncPromptActiveFlag(p._id);

  // 6) Response
  return {
    prompt: {
      id: String(p._id),
      title: p.title,
      description: p.description ?? null,
      rules: p.rules ?? null,
      is_active: true,
    },
    challenge: {
      id: String(activeChallenge._id),
      start_date: activeChallenge.start_date,
      end_date: activeChallenge.end_date,
    },
  };
}

// GET /api/prompts/active (read only. Find active Challenge by dates, return it's Prompt like acceptance criterias ask)
const getActivePrompt = async (req, res, next) => {
  try {
    const result = await runPromptSync();
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listAllPrompts = (req, res) => {
  // Admin only; supports pagination (page, limit)
  // TODO: return paginated list of prompts
  return res
    .status(501)
    .json({ message: "Not implemented: GET /api/prompt/all" });
};

async function createPrompt(req, res) {
  // Admin only
  // Body: { title, description, rules, challenge: { start_date, end_date } }
  // TODO: validate, create prompt + challenge, default is_active=false
  try {
    const { title, description, rules, challenge } = req.body || {};

    // required fields
    if (
      !title ||
      !description ||
      !challenge?.start_date ||
      !challenge?.end_date
    ) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: {
          required: [
            "title",
            "description",
            "challenge.start_date",
            "challenge.end_date",
          ],
        },
      });
    }
    // lengths
    if (typeof title !== "string" || title.length > 120) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "title length must be ≤ 120" },
      });
    }
    if (typeof description !== "string" || description.length > 2000) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "description length must be ≤ 2000" },
      });
    }

    // dates
    const start = toUtcMidnight(challenge.start_date);
    const end = toUtcMidnight(challenge.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "Invalid ISO dates" },
      });
    }

    // 1) Create Prompt (keep is_active default=false; activation handled elsewhere)
    const prompt = await Prompt.create({
      title,
      description,
      rules: typeof rules === "string" ? rules : undefined,
    });

    // 2) Create or update Challenge for this window
    const exist = await Challenge.findOne({
      start_date: start,
      end_date: end,
    }).select("_id start_date end_date");
    if (exist) {
      // overwrite prompt_id on existing challenge
      const updated = await Challenge.findByIdAndUpdate(
        exist._id,
        { $set: { prompt_id: prompt._id } },
        { new: true }
      ).select("_id start_date end_date");

      return res.status(200).json({
        prompt: {
          id: String(prompt._id),
          title: prompt.title,
          description: prompt.description ?? null,
          rules: prompt.rules ?? null,
          is_active:
            typeof prompt.is_active === "boolean" ? prompt.is_active : false,
        },
        challenge: {
          id: String(updated._id),
          start_date: updated.start_date,
          end_date: updated.end_date,
        },
      });
    } else {
      // create new challenge document
      const created = await Challenge.create({
        prompt_id: prompt._id,
        start_date: start,
        end_date: end,
      });

      return res.status(201).json({
        prompt: {
          id: String(prompt._id),
          title: prompt.title,
          description: prompt.description ?? null,
          rules: prompt.rules ?? null,
          is_active:
            typeof prompt.is_active === "boolean" ? prompt.is_active : false,
        },
        challenge: {
          id: String(created._id),
          start_date: created.start_date,
          end_date: created.end_date,
        },
      });
    }
  } catch (err) {
    console.error("createPrompt error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

const updatePrompt = (req, res) => {
  // Admin only; Path: :id
  // Body: partial update of fields, incl. toggling is_active and adjusting challenge window
  return res
    .status(501)
    .json({ message: "Not implemented: PATCH /api/prompt/:id" });
};

const deletePrompt = (req, res) => {
  // Admin only; Path: :id
  // TODO: delete prompt (and associated challenge)
  // 204 No Content
  return res
    .status(501)
    .json({ message: "Not implemented: DELETE /api/prompt/:id" });
};

const listPromptArtworks = (req, res) => {
  // Public; Path: :id; Query: q?, media_tag?, page?, limit?, sort?(recent|likes)
  // TODO: return paginated artworks for a prompt
  return res
    .status(501)
    .json({ message: "Not implemented: GET /api/prompt/:id/artworks" });
};

module.exports = {
  getActivePrompt,
  runPromptSync,
  listAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listPromptArtworks,
  toUtcMidnight,
};
