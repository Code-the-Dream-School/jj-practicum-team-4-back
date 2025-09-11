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
            return res.status(401).json({ error: 'User Not Authenticated' })
        }

        const token = authHeader.split(' ')[1]
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = {
                id: decoded.userId,
                first_name: decoded.firstName,
                last_name: decoded.lastName,
                fullName: decoded.fullName,
                picture: decoded.picture
            }
            next()
        } catch (error) {
            return res.status(401).json({ error: 'Invalid Token' })
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Issue Authenticating User' })
    }
}

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile'] })

const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.redirect('/auth/google')
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err)
            }
            // Create JWT token for the user
            const token = user.createJWT()
            const fullName = user.getName()

            // Encode user data to pass in URL params
            const userData = encodeURIComponent(JSON.stringify({ 
                fullName,
                picture: user.picture,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }))

            // Redirect to frontend homepage with token and user data
            return res.redirect(`${process.env.FRONTEND_URL}/gallery?auth=success&token=${token}&userData=${userData}`)
        })
    })(req, res, next)
}

module.exports = {
    isLoggedIn,
    googleAuth,
    googleCallback,
}