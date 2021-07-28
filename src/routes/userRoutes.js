const express = require('express');
const User = require('../models/User');

const userRouter = express.Router();
const authController = require('../controllers/authController')(User);

userRouter.route('/auth')
  .get(authController.requestSpotifyAuth);
userRouter.route('/auth/callback')
  .get(authController.authCallback);

module.exports = userRouter;