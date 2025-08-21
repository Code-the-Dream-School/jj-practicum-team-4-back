require('dotenv').config()
require('./auth')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const cors = require('cors')
const favicon = require('express-favicon')
const logger = require('morgan')



//Passport Inialization
app.use(passport.initialize())
app.use(passport.session())

//Routers
const mainRouter = require('./routes/mainRouter.js')
const authRouter = require('./routes/authRouter.js')

// middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(logger('dev'))
app.use(express.static('public'))
app.use(favicon(__dirname + '/public/favicon.ico'))

// routes
app.use('/api/v1', mainRouter)
app.use('/', authRouter)


module.exports = app