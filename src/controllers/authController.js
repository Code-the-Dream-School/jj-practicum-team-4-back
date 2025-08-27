
const signinLink = (req, res) => {
    try {
        res.status(200).send('<a href="/auth/google">Authentication with Google </a>')
    } catch (error) {
        res.status(400).send({ error: 'Unable To Sign In Using Google'})
    }
} 

const protectedPage = (req, res) => {
    try {
        if (req.user) {
            res.status(200).send({ message: `Welcome To ARTHIVE ${req.user.username}`})
        } else {
            res.status(401).send({ error: 'No User Was Found, Unable To Sign In'})
        }
    } catch (error) {
        res.status(500).send({ error: 'Internal Issue Signing In'})
    }
}

const logoutUser = (req, res, next) => {
    try {
        req.logout(err => {
            if (err) {
                return next(err)
            }
            res.status(200).send({ message: 'You Have Successfully Logged Out' })
        })
    } catch (error) {
        res.status(500).send({ error: 'Internal Issue Signing Out' })
    }
}


module.exports = {
    signinLink,
    protectedPage,
    logoutUser,
}