const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  _id: String,
  accessToken: String,
  refreshToken: String,
  expires: Number
});

module.exports = mongoose.model('User', userModel);