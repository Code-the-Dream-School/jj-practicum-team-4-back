const express = require ('express')
const router = express.Router()

const { isLoggedIn,  googleAuth, googleCallback } = require('../middleware/auth')
const { signinLink, protectedPage, logoutUser, login, register } = require('../controllers/authController')

router.get('/', signinLink)
router.get('/google', googleAuth)
router.get('/google/callback', googleCallback)
router.get('/protected', isLoggedIn, protectedPage)
router.get('/logout', logoutUser)
router.post('/login', login)
router.post('/register', register)




module.exports = router