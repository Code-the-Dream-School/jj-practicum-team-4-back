const passport = require('passport')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy
const User = require('../models/User.js')

passport.use(new GoogleStrategy({ 
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",
      passReqToCallback: true, 
    },
    async function(request, accessToken, refreshToken, profile, done) { 
    try {
        let user = await User.findOne({ googleId: profile.id }) 
        if (!user) {
            try {
                user = await User.create({
                    googleId: profile.id,
                    username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
                    first_name: profile.name.givenName,
                    last_name: profile.name.familyName,
                    email: profile.email,
                })
            } catch (createErr) {
                // Handle specific creation errors
                if (createErr.code === 11000) {
                    return done(new Error('A user with this email already exists. Please use your existing account.'), null)
                }
                if (createErr.name === 'ValidationError') {
                    return done(new Error('Invalid user data from Google. Please try again.'), null)
                }
                console.error('Google OAuth user creation error:', createErr)
                return done(new Error('Failed to create user account from Google profile.'), null)
            }
        }
        return done(null, user) 
    } catch (err) {
        console.error('Google OAuth general error:', err)
        if (err.name === 'MongooseError') {
            return done(new Error('Database connection issue. Please try again later.'), null)
        }
        return done(new Error('Authentication error. Please try again later.'), null)
    }
}))


passport.serializeUser((user, done) => done(null, user._id)) 
passport.deserializeUser(async (id, done) => { 
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch(err) {
        done(err, null)
    }
})



