const passport = require('passport')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy
const User = require('../models/User.js')

passport.use(new GoogleStrategy({ 
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: "http://localhost:5000/google/callback", 
      passReqToCallback: true, 
    },
    async function(request, accessToken, refreshToken, profile, done) { 
      try {
        let user = await User.findOne({ googleId: profile.id }) 
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName.replace(/\s+/g, '').toLowerCase(), //THIS WILL CHANGE IN THE FUTURE
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




//Notes:
//https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
//https://www.passportjs.org/packages/passport-google-oauth2/
//https://youtu.be/Q0a0594tOrc?si=AFlsMSJBn0dcj0Kj
//https://developers.google.com/identity/protocols/oauth2
//https://www.passportjs.org/concepts/delegated-authorization/
//https://expressjs.com/en/resources/middleware/session.html ---- Info on cookies: May Be An Issue In The Future
//https://mongoosejs.com/docs/5.x/docs/deprecations.html
