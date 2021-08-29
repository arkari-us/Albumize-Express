const express = require('express');
const User = require('../models/User');

const albumRouter = express.Router();
const albumController = require('../controllers/albumController')(User);
const userController = require('../controllers/userController')(User);

albumRouter.use(userController.authCheck)

albumRouter.route('/')
  .get(albumController.getNewReleaseAlbums);
albumRouter.route('/:id')
  .get(albumController.getAlbumsByPlaylistId);

  module.exports = albumRouter;