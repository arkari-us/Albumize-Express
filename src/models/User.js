const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  userid: String,
  username: String,
  accessToken: String,
  refreshToken: String,
  expires: Number,
  exportList: [String],
  eulaAccepted: Boolean
});

module.exports = mongoose.model('User', userModel);