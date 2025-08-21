const express = require ('express')
const router = express.Router()

const { isLoggedIn,  googleAuth, googleCallback, } = require('../middleware/auth')
const { landingPage, authFailure, protectedPage, logoutUser } = require('../controllers/authController')

router.get('/', landingPage)
router.get('/auth/google', googleAuth)
router.get('/google/callback', googleCallback)
router.get('/auth/failure', authFailure)
router.get('/protected', isLoggedIn, protectedPage)
router.get('/logout', logoutUser)




module.exports = router