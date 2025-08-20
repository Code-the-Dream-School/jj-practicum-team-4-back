//https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
//https://www.passportjs.org/packages/passport-google-oauth2/
//https://youtu.be/Q0a0594tOrc?si=AFlsMSJBn0dcj0Kj
//https://developers.google.com/identity/protocols/oauth2
//https://www.passportjs.org/concepts/delegated-authorization/

const passport = require('passport')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy
const User = require('../models/User.js')

passport.use(new GoogleStrategy({ //passport to use GoogleStrategy
      clientID: process.env.GOOGLE_CLIENT_ID, //Detail that is being passed to google
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, //Detail that is being passed to google
      callbackURL: "http://localhost:5000/google/callback", //redirects user after authentication
      passReqToCallback: true, //req is passed as the first argument to the verify callback because it requires two instances
    },
    async function(request, accessToken, refreshToken, profile, done) { //async function contains user info in 'profile' and shows that passport authentication is complete 'done'
      try {
        let user = await User.findOne({ googleId: profile.id }) //looks for user using the googleId. The googleId stored the info in profile Id
        if (!user) {//If no user is found with googleId, it begins createing a new user
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName.replace(/\s+/g, '').toLowerCase(), //Need to delete this 
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            email: profile.email,
          })
        }
        return done(null, user) //returns done when the autntication process has been completed
        //return done, null means no error occurred, user is the authenticated object. Move on to seralize user & start session
      } catch (err) {//try/catch error handling blcok
        return done(err, null)//If authentication fails in the try block, passport will throw error
      }
    }
  )
)


//user:the user object that google strategy authenticated//done:callback function tells passport what to store
passport.serializeUser((user, done) => done(null, user._id)) //Passport stores only the user_id in the session 'cookie'
passport.deserializeUser(async (id, done) => { //uses id to get the user information back (the value that is stored in the cookie)
    try {
        const user = await User.findById(id)//fetches the most up to date information from the database by 'id'
        done(null, user)//await waits for user info in order to pass through done
    } catch(err) {//Handles error from 'try' block
        done(err, null)
    }
})

//used await to return the promise. MongoDB returns the promise and await allows a pause until the promise resolves
//mongoDB creates a _id (field name) for every user profile created (serialization) from _id, the 'id' parameter is extracted which is the actual ID string (deserialization)
