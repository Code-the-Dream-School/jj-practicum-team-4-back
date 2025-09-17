const mainController = {};
const Artwork = require("../../models/Artwork");
const Prompt = require("../../models/Prompt");
const Challenge = require("../../models/Challenge");

// GET /api
mainController.get = (req, res) => {
  return res.json({
    data: "This is a full stack app!",
  });
};

// Homepage data: GET /api/home
// Reads active prompt (same rules as /api/prompts/active) + recent artworks.
// Does NOT switch anything (read-only).
mainController.getHome = async (_req, res) => {
  try {
    // 1) Try explicitly active prompt
    let activePrompt = await Prompt.findOne({ is_active: true }).select(
      "title description rules"
    );

    // 2) If none found, fallback to current challenge window
    let window = null;
    if (!activePrompt) {
      const now = new Date();
      const currentChallenge = await Challenge.findOne({
        start_date: { $lte: now },
        end_date: { $gt: now },
      }).populate({ path: "prompt_id", select: "title description rules" });

      if (currentChallenge?.prompt_id) {
        activePrompt = currentChallenge.prompt_id;
        window = {
          start: currentChallenge.start_date,
          end: currentChallenge.end_date,
        };
      }
    }

    // 3) Recent artworks feed for homepage
    const docs = await Artwork.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(12)
      .select(
        "title image_url media_tag like_counter user_id prompt_id createdAt"
      )
      .populate({ path: "user_id", select: "first_name image" });

    const recent_artworks = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url ?? null,
      media_tag: a.media_tag ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), first_name: a.user_id.first_name ?? null }
        : { id: null, first_name: null },
      prompt_id: a.prompt_id ? String(a.prompt_id) : null,
      createdAt: a.createdAt,
    }));

    return res.status(200).json({
      active_prompt: activePrompt
        ? {
            title: activePrompt.title,
            description: activePrompt.description ?? null,
            rules: activePrompt.rules ?? null,
            window, // null if we used is_active
          }
        : null, // stays null if nothing active in DB (это ок для фронта)
      recent_artworks,
    });
  } catch (err) {
    console.error("getHome error:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

// About page data: GET /api/about
mainController.getAbout = (_req, res) => {
  return res.status(200).json({
    project: "ArtHive",
    description: "Weekly art prompts with community submissions and favorites.",
  });
};

module.exports = mainController;
