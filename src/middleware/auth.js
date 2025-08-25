const passport = require('passport')

const isLoggedIn = (req, res, next) => {
    if (req.user) {
        return next()
    }
    res.status(401).json({ error: 'User not authenticated' })
}

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile']})

const googleCallback = passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/google',
})

module.exports = { 
    isLoggedIn, 
    googleAuth, 
    googleCallback, 
}