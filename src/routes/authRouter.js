const express = require ('express')
const router = express.Router()

const { isLoggedIn, landingPage, googleAuth, googleCallback, authFailure, protectedPage, logoutUser } = require('../controllers/authController')

router.get('/', landingPage)
router.get('/auth/google', googleAuth)
router.get('/google/callback', googleCallback)
router.get('/auth/failure', authFailure)
router.get('/protected', isLoggedIn, protectedPage)
router.get('/logout', logoutUser)




module.exports = router