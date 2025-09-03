// Handlers for prompt + challenge pairing

const Prompt = require("../../models/Prompt");
const Challenge = require("../../models/Challenge");

// keep only one active prompt flag true

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
async function runPromptSync(now = new Date()) {
  //Find a challenge that is "now"
  let activeChallenge = await Challenge.findOne({
    start_date: { $lte: now },
    end_date: { $gte: now },
  }).populate({
    path: "prompt_id",
    select: "title description rules is_active",
  });

  // if no active window by dates, try to create one for the currently active prompt
  if (!activeChallenge) {
    const activePrompt = await Prompt.findOne({ is_active: true }).select(
      "title description rules is_active"
    );

    if (activePrompt) {
      const { start, end } = getCurrentWeekWindowUTC(now);

      // idem: avoid duplicates for this prompt and this exact window
      let createdChallenge = await Challenge.findOne({
        prompt_id: activePrompt._id,
        start_date: start,
        end_date: end,
      });

      if (!createdChallenge) {
        createdChallenge = await Challenge.create({
          prompt_id: activePrompt._id,
          start_date: start,
          end_date: end,
        });
      }

      // populate to keep the same shape as above
      activeChallenge = await Challenge.findById(createdChallenge._id).populate(
        {
          path: "prompt_id",
          select: "title description rules is_active",
        }
      );
    }
  }

  if (!activeChallenge || !activeChallenge.prompt_id) {
    return { success: true, prompt: null };
  }

  const p = activeChallenge.prompt_id;

  await syncPromptActiveFlag(p._id); // Flags synchronization

  // Shape as in accept.creterias. Dates come from Challenge.

  return {
    success: true,
    prompt: {
      _id: p._id,
      title: p.title,
      description: p.description,
      rule: p.rules,
      start_date: activeChallenge.start_date.toISOString(),
      end_date: activeChallenge.end_date.toISOString(),
      is_active: true, // this prompt is attached to the current challlenge
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

const createPrompt = (req, res) => {
  // Admin only
  // Body: { title, description, rules, challenge: { start_date, end_date } }
  // TODO: validate, create prompt + challenge, default is_active=false
  return res.status(501).json({ message: "Not implemented: POST /api/prompt" });
};

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
};
