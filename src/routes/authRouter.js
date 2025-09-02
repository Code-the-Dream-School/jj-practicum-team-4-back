const express = require ('express')
const router = express.Router()

const { isLoggedIn,  googleAuth, googleCallback, } = require('../middleware/auth')
const { signinLink, protectedPage, logoutUser } = require('../controllers/authController')

router.get('/', signinLink)
router.get('/google', googleAuth)
router.get('/google/callback', googleCallback)
router.get('/protected', isLoggedIn, protectedPage)
router.get('/logout', logoutUser)




module.exports = router