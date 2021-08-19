const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  userid: String,
  accessToken: String,
  refreshToken: String,
  expires: Number
});

module.exports = mongoose.model('User', userModel);