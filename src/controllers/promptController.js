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

// GET /api/prompts/active (read only. Find active Challenge by dates, return it's Prompt like acceptance criterias ask)

const getActivePrompt = async (req, res, next) => {
  try {
    const now = new Date();

    //Find a challenge that is "now"
    const activeChallenge = await Challenge.findOne({
      start_date: { $lte: now },
      end_date: { $gte: now },
    }).populate({
      path: "prompt_id",
      select: "title description rules is_active",
    });

    if (!activeChallenge || !activeChallenge.prompt_id) {
      return res.status(200).json({ success: true, prompt: null });
    }

    const p = activeChallenge.prompt_id;

    await syncPromptActiveFlag(p._id); // Synchronization

    // Shape as in accept.creterias. Dates come from Challenge. Rule maps from 'riles'

    return res.status(200).json({
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
    });
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
  listAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listPromptArtworks,
};
