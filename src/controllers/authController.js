const passport = require('passport')

function isLoggedIn(req, res, next) { //most-likely to move to middleware
    req.user ? next() : res.sendStatus(401) //Screen for when we have tried to access without loging in
}//Does user exist? If yes, authorize, if not, send 401 error

const landingPage = (req, res) => {
    res.send('<a href="/auth/google">Authentication with Google </a>')
} //The landing page link that we have.

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile']})

const googleCallback = passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
})

const authFailure = (req, res) => {
    console.log('Something Went Wrong..')
}

const protectedPage = (req, res) => {
    res.send(`Welcome ${req.user.username}`) //this was changed and may need to change in the future
    console.log('You have been signed in')
}

const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        console.log('You have been logged out')
        res.redirect('/')
    })
}
module.exports = {
    isLoggedIn,
    landingPage,
    googleAuth,
    googleCallback,
    authFailure,
    protectedPage,
    logoutUser,
}