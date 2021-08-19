const mongoose = require('mongoose');
const User = require('../models/User');
const urlParse = require('url-parse');
const qs = require('qs');
const { default: axios } = require('axios');

const stateKey = 'auth_state';
const authKeyKey = 'authKey';

function userController(User) {

  function requestSpotifyAuth(req, res) {
    if (req.cookies && req.cookies[stateKey]) {
      res.clearCookie(stateKey);
    }
    const state = createStateString()
    res.cookie(stateKey, state);
    res.redirect('https://accounts.spotify.com/authorize?' +
      'response_type=code' +
      '&client_id=' + process.env.CLIENT_ID +
      '&scope=playlist-read-private' +
      '&redirect_uri=' + process.env.CALLBACK_URI +
      '&state=' + state);
  }

  function authCallback(req, res) {
    const query = qs.parse(urlParse(req.url).query, { ignoreQueryPrefix: true });
    if (!req.cookies || !req.cookies[stateKey] || !query || !query.state || req.cookies[stateKey] !== query.state) {
      res.status(400);
      return res.send('State mismatch');
    }

    authCode = query.code;

    res.clearCookie(stateKey);

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const postQuery = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: process.env.CALLBACK_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    }

    axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify(postQuery),
      headers
    )
      .then((spotifyKeys) => {
        const keys = {
          refreshToken: spotifyKeys.data.refresh_token,
          accessToken: spotifyKeys.data.access_token,
          expires: new Date().getTime() + spotifyKeys.data.expires_in
        }
        const user = new User(keys);

        //need to add a Spotify call to get user ID and use that instead of token
        const query = {
          refreshToken: spotifyKeys.data.refresh_token
        }

        //upsert user
        User.findOneAndUpdate(query, user, {upsert: true}, function(err, doc) {
          if (err) {
            return res.send(err);
          }
          res.cookie(authKeyKey, doc.accessToken);
          res.redirect(process.env.CLIENT_URI)
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function createStateString() {
    var res = '';
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 16; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return res;
  }

  return { requestSpotifyAuth, authCallback };
}

module.exports = userController;