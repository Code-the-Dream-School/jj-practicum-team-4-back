const passport = require('passport')
const jwt = require('jsonwebtoken')
const User = require('../../models/User')

const isLoggedIn = (req, res, next) => {
    try {
        if (req.user) {
            return next()
        }
        const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No Token Provided' })
            }

        const token = authHeader.split(' ')[1]
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                req.user = {
                    id: decoded._id,
                    first_name: decoded.firstName, 
                    fullName: decoded.fullName
                }
                next()
            } catch (error) {
                return res.status(401).json({ error: 'Invalid Token'})
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Issue Authenticating User' })
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