const { Storage } = require('@google-cloud/storage')
require('dotenv').config()
const Multer = require('multer') 
const { Readable } = require('stream')


const upload = Multer({
  storage: Multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 }, 
})
exports.uploadSingleImage = upload.single("file")


const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
})

const bucket = storage.bucket(process.env.BUCKET_NAME)


exports.uploadImage = async (req, res) => {
  if (!req.file) { 
    return res.status(400).send("No file uploaded.")
  }

  const fileBuffer = req.file.buffer 
  const fileStream = new Readable({
    read() {},
  })
  fileStream.push(fileBuffer)
  fileStream.push(null) 

  const destinationPath = req.file.originalname   
  const writeStream = bucket.file(destinationPath).createWriteStream({
    resumable: false,
    contentType: "auto",
  })
  
  writeStream.on("error", (err) => {
    console.error(`Error uploading image: ${err}`)
    res.status(500).send("Error uploading image.")
  })

  writeStream.on("finish", () => {
    bucket
      .file(destinationPath)
      .makePublic()
      .then(() => {
        const imageUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${destinationPath}`
        res.status(200).send({ url: imageUrl })
      })
      .catch((err) => {
        console.error(`Error making image public: ${err}`)
        res.status(500).send("Error making image public.")
      })
  })

  fileStream.pipe(writeStream)
}

exports.getImage = async (req, res) => {
  const { filename } = req.params
  const options = {
    action: "read",
    expires: Date.now() + 5 * 60 * 1000, 
  }

  bucket.file(filename).getSignedUrl(options, (err, url) => { 
    if (err) {
      console.error(`Error retrieving file: ${err}`)
      return res.status(500).send("Error retrieving file.")
    }
    res.redirect(url) 
  })
}

exports.uploadFileAndGetUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file uploaded."))

    const fileBuffer = file.buffer
    const { Readable } = require("stream")
    const fileStream = new Readable({ read() {} })
    fileStream.push(fileBuffer)
    fileStream.push(null)

    const destinationPath = Date.now() + "-" + file.originalname
    const writeStream = bucket.file(destinationPath).createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    })

    writeStream.on("error", reject)

    writeStream.on("finish", async () => {
      try {
        await bucket.file(destinationPath).makePublic()
        const imageUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${destinationPath}`
        resolve(imageUrl)
      } catch (err) {
        reject(err)
      }
    })

    fileStream.pipe(writeStream)
  })
}