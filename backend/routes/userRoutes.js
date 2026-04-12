const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMe, updateProfile } = require('../controllers/authController');

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
