const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const bcrypt = require('bcrypt')


const signinLink = (req, res) => {
    try {
        res.status(200).send(`
            <a href="/auth/google">Authentication with Google </a>
            `)
    } catch (error) {
        res.status(400).json({ error: 'Unable To Sign In Using Google'})
    }
} 

const protectedPage = (req, res) => {
    try {
        if (req.user) {
            res.status(200).send({ message: `Welcome To ARTHIVE ${req.user.first_name}`}) //Look at previous PR's to find the username method
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
            res.status(200).json({ message: 'You Have Successfully Logged Out' })
        })
    } catch (error) {
        res.status(500).json({ error: 'Internal Issue Signing Out' })
    }
}

const login = async (req, res) => {
    const {email, password} = req.body
    if(!email || !password){
        return res.status(400).json({message: 'Please Provide Email And Password'})
    }
    const user = await User.findOne({email})
    if(!user){
        return res.status(401).json({message: 'Invalid Credentials'})
    }
    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect) {
        return res.status(401).json({message: 'Invalid Credentials'})
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
        res.status(500).send({ error: 'Internal Issue Registering' })
    }
}

module.exports = {
    signinLink,
    protectedPage,
    logoutUser,
    login,
    register,
}
