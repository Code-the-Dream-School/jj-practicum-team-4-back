// Handlers for prompt + challenge pairing

const Prompt = require("../../models/Prompt");
const Challenge = require("../../models/Challenge");
const mongoose = require("mongoose");
const Artwork = require("../../models/Artwork");

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

    let win = await Challenge.findOne({
      start_date: normStart,
      end_date: normEnd,
    }).select("_id prompt_id start_date end_date");

    if (!win) {
      // creating new recordwith  prompt_id one time (witout $setOnInsert + $set)
      const created = await Challenge.create({
        start_date: normStart,
        end_date: normEnd,
        prompt_id: promptIdToUse,
        artworks: [],
        participants: [],
      });
      activeChallenge = await Challenge.findById(created._id).populate({
        path: "prompt_id",
        select: "title description rules is_active",
      });
    } else {
      // challenge window exists, so updating the prompt_id only
      if (!win.prompt_id || String(win.prompt_id) !== String(promptIdToUse)) {
        await Challenge.findByIdAndUpdate(
          win._id,
          { $set: { prompt_id: promptIdToUse } },
          { new: false }
        );
      }
      // re-population for consistent response shape
      activeChallenge = await Challenge.findById(win._id).populate({
        path: "prompt_id",
        select: "title description rules is_active",
      });
    }
  }
  // 4) Safety
  if (!activeChallenge || !activeChallenge.prompt_id) {
    return { message: "No active challenge" };
  }

  // 5) Sync flags: only this prompt must be active
  const p = activeChallenge.prompt_id;
  if (!p.is_active) {
    await syncPromptActiveFlag(p._id);
  }
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

const listAllPrompts = async (req, res, next) => {
  // Admin only; supports pagination (page, limit)
  // TODO: return paginated list of prompts
  // GET /api/prompts/all

  try {
    // query params: page, limit
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Prompt.countDocuments({}),
      Prompt.find({}, "title description rules is_active createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    const items = docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      description: d.description,
      rules: d.rules,
      is_active: !!d.is_active,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({
      items,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
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

async function updatePrompt(req, res) {
  // PATCH /api/prompts/:id (Auth=Yes, Admin=Yes)
  // Edits prompt fields; if is_active=true, ensures it's the only active prompt.
  // If challenge dates are provided, BOTH start_date and end_date are required.
  // On date conflict, the prompt is moved into the existing window.

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id" },
      });
    }

    const { title, description, rules, is_active, challenge } = req.body || {};

    //  Basic field validation (only if provided)
    if (
      title !== undefined &&
      (typeof title !== "string" || title.length === 0 || title.length > 120)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "title length must be 1..120" },
      });
    }
    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 2000)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "description length must be ≤ 2000" },
      });
    }
    if (rules !== undefined && typeof rules !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "rules must be string" },
      });
    }
    if (is_active !== undefined && typeof is_active !== "boolean") {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "is_active must be boolean" },
      });
    }

    // Load prompt
    let promptDoc = await Prompt.findById(id);
    if (!promptDoc) {
      return res.status(404).json({ error: "Not Found", code: "NOT_FOUND" });
    }

    // Update prompt fields (except is_active=true which is handled separately)
    const toSet = {};
    if (title !== undefined) toSet.title = title;
    if (description !== undefined) toSet.description = description;
    if (rules !== undefined) toSet.rules = rules;
    if (is_active === false) toSet.is_active = false; // just turn it off if explicitly false

    if (Object.keys(toSet).length) {
      promptDoc = await Prompt.findByIdAndUpdate(
        id,
        { $set: toSet },
        { new: true }
      );
    }

    //If is_active=true , ensure single active prompt using the helper
    if (is_active === true) {
      await syncPromptActiveFlag(promptDoc._id);
      promptDoc.is_active = true; // reflect in response
    }

    //Challenge window update (optional)
    // We require BOTH start_date and end_date if "challenge" object is present
    let challengeDoc = await Challenge.findOne({
      prompt_id: promptDoc._id,
    }).select("_id start_date end_date prompt_id");

    if (challenge !== undefined) {
      const hasStart = typeof challenge?.start_date === "string";
      const hasEnd = typeof challenge?.end_date === "string";
      if (!hasStart || !hasEnd) {
        return res.status(400).json({
          error: "Bad Request",
          code: "BAD_REQUEST",
          details: {
            field:
              "challenge.start_date and challenge.end_date are both required",
          },
        });
      }

      const nextStart = new Date(challenge.start_date);
      const nextEnd = new Date(challenge.end_date);
      if (isNaN(nextStart.getTime()) || isNaN(nextEnd.getTime())) {
        return res.status(400).json({
          error: "Bad Request",
          code: "BAD_REQUEST",
          details: { field: "Invalid ISO dates" },
        });
      }

      // If there's already a challenge with the same window, move this prompt into it.
      const conflict = await Challenge.findOne({
        start_date: nextStart,
        end_date: nextEnd,
      }).select("_id start_date end_date prompt_id");

      if (conflict) {
        const moved = await Challenge.findByIdAndUpdate(
          conflict._id,
          { $set: { prompt_id: promptDoc._id } },
          { new: true }
        ).select("_id start_date end_date");

        // Remove old window if it was different
        if (challengeDoc && String(challengeDoc._id) !== String(moved._id)) {
          await Challenge.findByIdAndDelete(challengeDoc._id);
        }
        challengeDoc = moved;
      } else if (challengeDoc) {
        // Update existing window dates
        challengeDoc = await Challenge.findByIdAndUpdate(
          challengeDoc._id,
          { $set: { start_date: nextStart, end_date: nextEnd } },
          { new: true }
        ).select("_id start_date end_date");
      } else {
        // Create a new window for this prompt
        challengeDoc = await Challenge.create({
          prompt_id: promptDoc._id,
          start_date: nextStart,
          end_date: nextEnd,
        });
      }
    }

    // Response
    return res.status(200).json({
      prompt: {
        id: String(promptDoc._id),
        title: promptDoc.title,
        description: promptDoc.description ?? null,
        rules: promptDoc.rules ?? null,
        is_active: !!promptDoc.is_active,
      },
      challenge: challengeDoc
        ? {
            id: String(challengeDoc._id),
            start_date: challengeDoc.start_date,
            end_date: challengeDoc.end_date,
          }
        : null,
    });
  } catch (err) {
    console.error("updatePrompt error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

// DELETE /api/prompts/:id (Auth=Yes, Admin=Yes)
async function deletePrompt(req, res) {
  try {
    const { id } = req.params;

    // 400 — wrong id format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id" },
      });
    }

    // looking for prompt
    const promptDoc = await Prompt.findById(id).select("_id is_active");
    if (!promptDoc) {
      return res.status(404).json({ error: "Not Found", code: "NOT_FOUND" });
    }
    // blocking the deletion of an actie prompt
    if (promptDoc.is_active) {
      return res.status(409).json({
        error: "Conflict",
        code: "ACTIVE_PROMPT_DELETE_FORBIDDEN",
        message:
          "Cannot delete an active prompt. Deactivate or switch active prompt first.",
      });
    }

    // deleting connected challenges if any
    await Challenge.deleteMany({ prompt_id: promptDoc._id });

    // deleting prompt
    await Prompt.deleteOne({ _id: promptDoc._id });

    // err 204
    return res.status(204).send();
  } catch (err) {
    console.error("[DELETE /api/prompts/:id] error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
    });
  }
}

// GET /api/prompts/:id/artworks
// Public endpoint that will return artworks for a given prompt

async function listArtworksByPrompt(req, res) {
  try {
    const { id } = req.params;

    // validate ObjectId

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id", reason: "Invalid ObjectId" },
      });
    }

    // ensure prompt exists

    const promptExists = await Prompt.exists({ _id: id });
    if (!promptExists) {
      return res.status(404).json({
        error: "Not Found",
        code: "NOT_FOUND",
      });
    }

    // parse and validate entry

    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const rawSort = req.query.sort; // 'recent' | 'likes'
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const media =
      typeof req.query.media_tag === "string" ? req.query.media_tag.trim() : "";

    const page = rawPage ? parseInt(rawPage, 10) : 1;
    const limit = rawLimit ? parseInt(rawLimit, 10) : 20;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "page", reason: "Must be integer ≥ 1" },
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: {
          field: "limit",
          reason: "Must be integer between 1 and 100",
        },
      });
    }

    let sort = "likes";
    if (rawSort === "recent" || rawSort === "likes") {
      sort = rawSort;
    } else if (rawSort !== undefined) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "sort", reason: "Supported values: recent | likes" },
      });
    }

    // build filter

    const filter = { prompt_id: id };
    if (media) filter.media_tag = media;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    // sort spec // tie-breaker: ensure stable order when values are equal

    const sortSpec =
      sort === "recent"
        ? { createdAt: -1, _id: -1 }
        : { like_counter: -1, createdAt: -1, _id: -1 };

    // query and pagination

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      //it's faster to use promise
      Artwork.countDocuments(filter), // need to count artworks after filter and return correct total to count pages
      Artwork.find(filter)
        .sort(sortSpec) // by rule: recent -> createdAr desc, likes -> like_counter desc
        .skip(skip) // skipping needed number of documents to be at the needed page
        .limit(limit)
        .select(
          "title image_url media_tag like_counter user_id prompt_id createdAt"
        ) // requesting from DB only needed fields
        .populate({ path: "user_id", select: "first_name" }),
    ]);
    // map to response
    const items = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url,
      media_tag: a.media_tag ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), first_name: a.user_id.first_name }
        : { id: null, first_name: null },
      prompt_id: String(a.prompt_id),
      createdAt: a.createdAt?.toISOString?.() ?? null,
    }));

    return res.status(200).json({ items, page, limit, total });
  } catch (err) {
    console.error("listArtworksByPrompt error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

module.exports = {
  getActivePrompt,
  runPromptSync,
  listAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  toUtcMidnight,
  listArtworksByPrompt,
};
