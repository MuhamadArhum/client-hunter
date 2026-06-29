const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile, changePassword, uploadAvatar,
  forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerRules, loginRules, updateProfileRules, changePasswordRules,
  forgotPasswordRules, resetPasswordRules,
} = require('../middleware/validate');

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileRules, updateProfile);
router.put('/password', protect, changePasswordRules, changePassword);
router.put('/avatar', protect, uploadAvatar);

module.exports = router;
