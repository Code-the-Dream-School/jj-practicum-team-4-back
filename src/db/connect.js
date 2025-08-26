const mongoose = require('mongoose')

const connectDB = (url) => {
  return mongoose.connect(url)
}

module.exports = connectDB











//Notes:
//Alternative (Different Version)
//mongoose.connect(process.env.MONGO_URI, {
//     //useNewUrlParser: true,
//     //useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error('MongoDB connection error:', err))
// 
//
