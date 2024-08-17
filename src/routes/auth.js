const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    res.status(201).send({ message: 'User registered successfully' })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username })
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).send({ error: 'Invalid login credentials' })
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({ token });
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmMwYmQxNjNmNTIwYWRhNjdlZmJmNDMiLCJpYXQiOjE3MjM5MDczNzN9.8mYF2RqsYeBypibjKwg0mnheuWeqh3dN9NDPxqCgbRc