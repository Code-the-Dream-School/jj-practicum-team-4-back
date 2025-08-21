
const landingPage = (req, res) => {
    res.status(200).send('<a href="/auth/google">Authentication with Google </a>')
} 

const authFailure = (req, res) => {
    res.status(404).send({ error: 'Something Went Wrong'})
}

const protectedPage = (req, res) => {
    if (req.user) {
        res.status(200).send({ message: `Welcome ${req.user.username}`})
    } else {
        res.status(401).send({ error: 'No User Has Been Found.'})
    }
}

const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        res.status(200).send({ message: 'You have been logged out'})
    })
}

module.exports = {
    landingPage,
    authFailure,
    protectedPage,
    logoutUser,
}