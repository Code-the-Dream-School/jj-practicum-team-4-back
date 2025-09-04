require('dotenv').config()
require('./auth')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const connectDB = require('./db/connect')
const cors = require('cors')
const favicon = require('express-favicon')
const logger = require('morgan')


//MongoDB

connectDB(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

const app = express()
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}))

//Passport Inialization
app.use(passport.initialize())
app.use(passport.session())

//Routers
const mainRouter = require('./routes/mainRouter.js')
const authRouter = require('./routes/authRouter.js')
const testRouter = require('./routes/testRouter.js')

// CORS configuration using environment variables
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Other middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(logger('dev'))
app.use(express.static('public'))
app.use(favicon(__dirname + '/public/favicon.ico'))

// Register Routes
app.use('/', authRouter)
app.use('/api', mainRouter)
app.use('/test', testRouter)


module.exports = app
//Testing