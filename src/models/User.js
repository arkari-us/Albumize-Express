const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
    spotifyAccessToken: String,
    spotifyRefreshToken: String
});

module.exports = mongoose.model('User', userModel);