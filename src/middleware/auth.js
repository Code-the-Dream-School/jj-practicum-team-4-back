const passport = require('passport')

const isLoggedIn = (req, res, next) => {
    try {
        if (req.user) {
            return next()
        }
        res.status(401).send({ error: 'User Not Authenticated' })
    } catch (error) {
        res.status(500).send({ error: 'Internal Issue Authenticating User' })
    }
}

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile']})

const googleCallback = passport.authenticate('google', {
    successRedirect: '/auth/protected',
    failureRedirect: '/auth/google',
})

module.exports = { 
    isLoggedIn, 
    googleAuth, 
    googleCallback, 
}