const mongoose = require("mongoose")
const fs = require("fs")
const path = require("path")
const User = require("../../models/User")
const Artwork = require("../../models/Artwork")
const Prompt = require("../../models/Prompt")
  

// Parse pagination
const parsePagination = (req) => {
  const page = parseInt(req.query.page) || 1 //default page 1
  const limit = parseInt(req.query.limit) || 10 //defaults 10 items per page
  const skip = (page - 1) * limit //Detemines the number of items to exclude based on desired page and item limits
  return { page, limit, skip }
}
//Returns page number, number of items per page, and items to skip in the mongodb

// Search Component
const searchArtworks = async (req, res) => {
  try { //Filtering Component
    const { q, media_tag, prompt_id, sort: rawSort } = req.query //filterring components
    const { page, limit, skip } = parsePagination(req) //Adds the parse pagnitation

    let filter = {} //Initial filtering component
    if (q) filter.title = { $regex: q, $options: "i" } //case insensitive searching by 'q'
    if (media_tag) filter.media_tag = media_tag //filter by mediatag
    if (prompt_id && mongoose.isValidObjectId(prompt_id)) //Ensures promptID exists as a mongo object. PromptId filter
      filter.prompt_id = prompt_id

    // Determine sorting component and error handling
    let sortField = "recent" // default sorting component
    if (rawSort) {
      const allowedSorts = ["recent", "oldest", "likes", "title", "media_tag"]
      if (!allowedSorts.includes(rawSort)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "BAD_REQUEST",
          details: { field: "sort", reason: "Supported values: recent | likes | title | media_tag" },
        })
      }
      sortField = rawSort
    }

    // Define sortSpec
    const sortSpec =
      sortField === "recent" //decendsing order
        ? { createdAt: -1, _id: -1 }
        : sortField === "oldest" //ascending order
        ? { createdAt: 1, _id: 1}
        : sortField === "likes" //highest liked artwork first
        ? { like_counter: -1, createdAt: -1, _id: -1 }
        : sortField === "title" //Alphabetical order, starting with A
        ? { title: 1, _id: 1 }
        : { media_tag: 1, _id: 1 } //By Media tag sorting 

    const total = await Artwork.countDocuments(filter)
    const items = await Artwork.find(filter)
      .populate("user_id", "image")
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)

    res.status(200).json({ items, page, limit, total })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "We're experiencing technical difficulties. Please try again later." })
  }
}


// CREATE ARTWORK (Auth Required)
const createArtwork = async (req, res) => {
  try { //Parameter components and charater constraints
    if (!req.user) return res.status(401).json({ message: "Unauthorized, please try logging in." })

    const { title, description, media_tag, prompt_id } = req.body
    if (!title || title.length > 100)
      return res.status(400).json({ message: "The title is too long. Please try again." })
    if (description && description.length > 500)
      return res.status(400).json({ message: "The description is too long. Please try again." })

    if (!req.file) return res.status(400).json({ message: "No file was found.  Please try again." })

    // Enforce file type (example: images only)
    const fileTypes = ["image/jpeg", "image/png", "image/gif"] //files types allowed
    if (!fileTypes.includes(req.file.mimetype)) { //checks file type
      fs.unlinkSync(req.file.path) //makes sure file is compatible and stores in req.file.path
      return res.status(400).json({ message: "This is an invalid file type. Please only upload jpeg, png, or gif." })
    }

    // File sizing for 5 MB
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path)
      return res.status(413).json({ message: "Your file is too large." })
    }

    const newArtwork = await Artwork.create({ //creates artwork db component
      user_id: req.user.id,
      title,
      description,
      media_tag,
      prompt_id,
      image_url: `/uploads/${req.file.filename}`, //file path for the uploaded component
    })

    // Add artwork to user model
    await User.findByIdAndUpdate(req.user._id, {
      $push: { userArtworks: newArtwork._id },
    })

    res.status(201).json({ artwork: newArtwork })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
  }
}

// GET ARTWORK BY ID 
const getArtworkById = async (req, res) => {
  try {
    const { id } = req.params //Checks object value exists in DB
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid MongoDB object ID." })

    const artwork = await Artwork.findById(id).populate("user_id", "image") //Finds by using ID
    if (!artwork) return res.status(404).json({ message: "Artwork was not found." })

    res.status(200).json({ artwork })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
  }
}

// DELETE ARTWORK 
const deleteArtwork = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized user. Please try again." })

    const { id } = req.params
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid MongoDB object ID." })

    const artwork = await Artwork.findById(id)
    if (!artwork) return res.status(404).json({ message: "Artwork was not found." })

    // Normalize IDs
    const artworkOwnerId = artwork.user_id?._id ? artwork.user_id._id.toString() : artwork.user_id.toString()
    const currentUserId = req.user.id

    // Check ownership status: user or admin
    if (!req.user.is_admin && artworkOwnerId !== currentUserId) {
      return res.status(403).json({ message: "You do not have permission to delete this post." })
    }

    // Checks existant of file and then deletes
    if (artwork.image_url) {
      const filePath = path.join(__dirname, "../public", artwork.image_url)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    //Removes artwork object from MongoDB
    await artwork.deleteOne()

    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error. Please try again later." })
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
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
  listArtworksByPrompt,
}