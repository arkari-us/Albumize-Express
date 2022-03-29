const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  userid: String,
  username: String,
  accessToken: String,
  refreshToken: String,
  exportList: [String]
});

module.exports = mongoose.model('User', userModel);