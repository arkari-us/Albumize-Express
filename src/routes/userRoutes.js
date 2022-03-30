const express = require('express');
const User = require('../models/User');

const userRouter = express.Router();
const userController = require('../controllers/userController')(User);

userRouter.route('/')
  .get(userController.getUser, userController.authCheck)
  .delete(userController.logout, userController.authCheck);
userRouter.route('/auth')
  .get(userController.requestSpotifyAuth)
  .delete(userController.removeUser, userController.authCheck);
userRouter.route('/auth/callback')
  .get(userController.authCallback);

module.exports = userRouter;