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
    return res.status(200).json({ 
      user: {
        id: user._id,
        fullName,
        picture: user.picture,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin
      }, 
      token 
    })
}


const register = async (req, res) => {
    try {
        const user = await User.create({ ...req.body })
        const fullName = user.getName()
        const token = user.createJWT()
        res.status(201).json({ 
          user: {
            fullName,
            picture: user.picture,
            first_name: user.first_name,
            last_name: user.last_name
          }, 
          token 
        })
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

const getCurrentUser = (req, res) => {
    try {
        // If user is authenticated via session or token
        if (req.user) {
            const userData = {
                id: req.user._id,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                fullName: req.user.first_name + ' ' + req.user.last_name,
                email: req.user.email,
                picture: req.user.picture,
                social_handle: req.user.social_handle,
                is_admin: req.user.is_admin,
                createdAt: req.user.createdAt
            }
            return res.status(200).json({ user: userData })
        }
        return res.status(401).json({ error: 'User not authenticated' })
    } catch (error) {
        console.error('Error fetching current user:', error)
        return res.status(500).json({ error: 'Server error while fetching user data' })
    }
}

module.exports = {
    signinLink,
    protectedPage,
    logoutUser,
    login,
    register,
    getCurrentUser
}
