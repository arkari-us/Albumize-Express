const express = require('express');
const User = require('../models/User');

const userRouter = express.Router();
const userController = require('../controllers/userController')(User);

userRouter.route('/auth')
  .get(userController.requestSpotifyAuth);
userRouter.route('/auth/callback')
  .get(userController.authCallback);

module.exports = userRouter;