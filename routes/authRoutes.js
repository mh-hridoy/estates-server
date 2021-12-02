const express = require('express')
const { signup, login, sendResetCode, verifyCode, changePassword, deleteAccount, logout } = require('../controllers/authControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();
router.post('/signup', signup)
router.post('/login', login)
router.get('/logout', logout)
router.post('/reset-password', sendResetCode)
router.post('/verify-code', verifyCode)
router.patch('/change-password', changePassword)
router.delete('/delete-account', protectedRoute, deleteAccount)

module.exports = router;

