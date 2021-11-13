const express = require('express');
const User = require('../models/User');

const playlistRouter = express.Router();
const playlistController = require('../controllers/playlistController')(User);
const userController = require('../controllers/userController')(User);

playlistRouter.use(userController.authCheck);

playlistRouter.route('/newplaylist')
  .get(playlistController.createPlaylistFromAlbums);

module.exports = playlistRouter;