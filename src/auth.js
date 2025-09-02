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
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            email: profile.email,
          })
        }
        return done(null, user) 
      } catch (err) {
        return done(err, null)
      }
    }
  )
)


passport.serializeUser((user, done) => done(null, user._id)) 
passport.deserializeUser(async (id, done) => { 
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch(err) {
        done(err, null)
    }
})



