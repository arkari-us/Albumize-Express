const express = require('express');
const User = require('../models/User');

const albumRouter = express.Router();
const albumController = require('../controllers/albumController')(User);
const authController = require('../controllers/authController')(User);

albumRouter.use(authController.authCheck)

albumRouter.route('/')
  .get(albumController.getNewReleaseAlbums);
albumRouter.route('/:id')
  .get(albumController.getAlbumsByPlaylistId);

  module.exports = albumRouter;