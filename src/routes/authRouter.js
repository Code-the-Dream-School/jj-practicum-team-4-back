const express = require('express')
const router = express.Router()
const passport = require('passport')
const authController = require('../controllers/authController')
const userAuthController = require('../controllers/userAuthController')
const { register, login } = require('../controllers/userAuthController')
const { isLoggedIn, googleAuth, googleCallback } = require('../middleware/auth')
const { signinLink, protectedPage, logoutUser } = require('../controllers/authController')

// Basic auth routes
router.post('/register', register)
router.post('/login', login)
router.get('/logout', logoutUser)

// Google auth routes
router.get('/', signinLink)
router.get('/auth/google', googleAuth)
router.get('/google/callback', googleCallback)
router.get('/protected', isLoggedIn, protectedPage)




module.exports = router