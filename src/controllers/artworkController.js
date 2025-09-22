const mongoose = require("mongoose");
const User = require("../../models/User");
const Artwork = require("../../models/Artwork");
const { uploadFileAndGetUrl } = require("./imageController");

const parsePagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const searchArtworks = async (req, res) => {
  try {
    const { q, media_tag, prompt_id, sort: rawSort } = req.query;
    const { page, limit, skip } = parsePagination(req);

    let filter = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    if (media_tag) filter.media_tag = media_tag;
    if (prompt_id && mongoose.isValidObjectId(prompt_id))
      filter.prompt_id = prompt_id;

    let sortField = "recent";
    if (rawSort) {
      const allowedSorts = ["recent", "oldest", "likes", "title", "media_tag"];
      if (!allowedSorts.includes(rawSort)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "BAD_REQUEST",
          details: {
            field: "sort",
            reason:
              "Supported values: recent | oldest | likes | title | media_tag",
          },
        });
      }
      sortField = rawSort;
    }

    const sortSpec =
      sortField === "recent"
        ? { createdAt: -1, _id: -1 }
        : sortField === "oldest"
        ? { createdAt: 1, _id: 1 }
        : sortField === "likes"
        ? { like_counter: -1, createdAt: -1, _id: -1 }
        : sortField === "title"
        ? { title: 1, _id: 1 }
        : { media_tag: 1, _id: 1 };

    const total = await Artwork.countDocuments(filter);
    const items = await Artwork.find(filter)
      .populate("user_id", "image")
      .sort(sortSpec)
      .skip(skip)
      .limit(limit);

    res.status(200).json({ items, page, limit, total });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message:
          "We're experiencing technical difficulties. Please try again later.",
      });
  }
};

const createArtwork = async (req, res) => {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ message: "Unauthorized, please try logging in." });

    const { title, description, media_tag, prompt_id } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "A title is required." });
    }

    if (title.trim().length > 100) {
      return res
        .status(400)
        .json({ message: "The title is too long. Please try again." });
    }

    if (description && description.length > 500)
      return res
        .status(400)
        .json({ message: "The description is too long. Please try again." });

    if (!req.file)
      return res
        .status(400)
        .json({ message: "No file was found.  Please try again." });

    const fileTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!fileTypes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({
          message:
            "This is an invalid file type. Please only upload jpeg, png, or gif.",
        });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(413).json({ message: "Your file is too large." });
    }

    const imageUrl = await uploadFileAndGetUrl(req.file);
    const newArtwork = await Artwork.create({
      user_id: req.user.id,
      title,
      description,
      media_tag,
      prompt_id,
      image_url: imageUrl,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { userArtworks: newArtwork._id },
    });

    res.status(201).json({ artwork: newArtwork });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid MongoDB object ID." });

    const artwork = await Artwork.findById(id).populate("user_id", "image");
    if (!artwork)
      return res.status(404).json({ message: "Artwork was not found." });

    res.status(200).json({ artwork });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const deleteArtwork = async (req, res) => {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ message: "Unauthorized user. Please try again." });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid MongoDB object ID." });

    const artwork = await Artwork.findById(id);
    if (!artwork)
      return res.status(404).json({ message: "Artwork was not found." });

    const artworkOwnerId = artwork.user_id?._id
      ? artwork.user_id._id.toString()
      : artwork.user_id.toString();
    const currentUserId = req.user.id;

    if (!req.user.is_admin && artworkOwnerId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this post." });
    }

    //delete in user

    await User.findByIdAndUpdate(artworkOwnerId, {
      $pull: { userArtworks: artwork._id },
    });

    await artwork.deleteOne();

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}


const getArtworkLikes = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid MongoDB object ID." })
    }

    const artwork = await Artwork.findById(id)
    if (!artwork) {
      return res.status(404).json({ message: "Artwork was not found." })
    }

    const userId = req.user ? req.user.id : null
    const liked_by_me = userId ? artwork.voters.includes(userId) : false

    res.status(200).json({
      like_counter: artwork.like_counter || 0,
      liked_by_me,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
  }
}


const addArtworkLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized user. Please log in." })
    }

    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid MongoDB object ID." })
    }

    const artwork = await Artwork.findById(id)
    if (!artwork) {
      return res.status(404).json({ message: "Artwork was not found." })
    }

    const userId = req.user.id
    if (artwork.voters.includes(userId)) {
      return res.status(409).json({ message: "You already liked this artwork." })
    }

    artwork.voters.push(userId)
    artwork.like_counter = (artwork.like_counter || 0) + 1
    await artwork.save()

    res.status(200).json({
      like_counter: artwork.like_counter,
      liked_by_me: true,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
  }
}


// Remove Like
const removeArtworkLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized user. Please log in." })
    }

    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid MongoDB object ID." })
    }

    const artwork = await Artwork.findById(id)
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found." })
    }

    const userId = req.user.id
    if (!artwork.voters.includes(userId)) {
      return res.status(404).json({ message: "You haven't liked this artwork." })
    }

    artwork.voters = artwork.voters.filter(
      (voterId) => voterId.toString() !== userId.toString()
    )
    artwork.like_counter = Math.max((artwork.like_counter || 1) - 1, 0)
    
    await artwork.save()

    res.status(200).json({
      like_counter: artwork.like_counter,
      liked_by_me: false,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
  }
}

module.exports = {
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
  getArtworkLikes,
  addArtworkLike,
  removeArtworkLike,
}