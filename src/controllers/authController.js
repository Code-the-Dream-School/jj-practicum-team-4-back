const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const bcrypt = require('bcrypt')


const signinLink = (req, res) => {
    try {
        res.status(200).send(`
            <a href="/auth/google">Sign in with Google</a>
        `)
    } catch (error) {
        res.status(400).json({ error: 'Sign-in failed: Unable to generate Google authentication.' })
    }
}

const protectedPage = (req, res) => {
    try {
        if (req.user) {
            res.status(200).send({ message: `Welcome to ARTHIVE, ${req.user.first_name}` })
        } else {
            res.status(401).send({ error: 'Access denied: You must be logged in to view this page.' })
        }
    } catch (error) {
        res.status(500).send({ error: 'Sign-in error: An unexpected server issue occurred.' })
    }
}

const logoutUser = (req, res, next) => {
    try {
        req.logout(err => {
            if (err) {
                return next(err)
            }
            res.status(200).json({ message: 'Logout successful: You have been signed out.' })
        })
    } catch (error) {
        res.status(500).json({ error: 'Logout failed: Unexpected server error while signing out. Please try again.' })
    }
}

const login = async (req, res) => {
    const {email, password} = req.body
    if(!email || !password){
        return res.status(400).json({message: 'Both email and password are required to log in.'})
    }
    const user = await User.findOne({email})
    if(!user){
        return res.status(401).json({message: 'Login failed: No account found with the provided email.'})
    }
    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect) {
        return res.status(401).json({message: 'Login failed: The password you entered is incorrect.'})
    }
    const fullName = user.getName()
    const token = user.createJWT()
    return res.status(200).json({ user: {fullName}, token })
}


const register = async (req, res) => {
    try {
        const user = await User.create({ ...req.body })
        const fullName = user.getName()
        const token = user.createJWT()
        res.status(201).json({ user: { fullName }, token })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Registration failed: Missing or invalid required fields.' })
        }

        if (error.code === 11000) {
            return res.status(400).json({ error: 'Registration failed: An account with this email already exists. Please try signing in with Google.' })
        }

        res.status(500).json({ error: 'Unexpected server error during registration. Please try again later.' })
    }
}

module.exports = {
    signinLink,
    protectedPage,
    logoutUser,
    login,
    register,
}
