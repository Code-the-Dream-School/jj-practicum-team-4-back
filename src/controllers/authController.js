const passport = require('passport')

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401) 
} ///middleware component

const landingPage = (req, res) => {
    res.send('<a href="/auth/google">Authentication with Google </a>')
} 

const googleAuth = passport.authenticate('google', { scope: ['email', 'profile']})

const googleCallback = passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
})

const authFailure = (req, res) => {
    console.log('Something Went Wrong..')
}

const protectedPage = (req, res) => {
    res.send(`Welcome ${req.user.username}`) 
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