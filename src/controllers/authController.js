const mongoose = require('mongoose');
const User = require('../models/User');
const urlParse = require('url-parse');
const qs = require('qs');
const { default: axios } = require('axios');

const stateKey = process.env.STATEKEY;
const idkey = process.env.IDKEY;
const upsertOptions = {
  upsert: true,
  useFindAndModify: false
}


function userController(User) {

  function requestSpotifyAuth(req, res) {
    if (req.cookies && req.cookies[stateKey]) {
      res.clearCookie(stateKey);
    }

    const state = createStateString()
    const query = qs.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: 'playlist-read-private user-read-private',
      redirect_uri: process.env.CALLBACK_URI,
      state: state
    });

    res.cookie(stateKey, state);
    res.redirect('https://accounts.spotify.com/authorize?' + query);
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
        //get user id (to be used as mongodb _id)
        axios.get(
          "https://api.spotify.com/v1/me", {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + spotifyKeys.data.access_token
          }
        })
          .then((profile) => {
            const userid = profile.data.id;

            const keys = {
              refreshToken: spotifyKeys.data.refresh_token,
              accessToken: spotifyKeys.data.access_token,
              expires: new Date().getTime() + spotifyKeys.data.expires_in
            }

            //upsert user
            User.findByIdAndUpdate(userid, { $set: keys }, upsertOptions, function (err, doc) {
              if (err) {
                return res.send(err);
              }
              res.cookie(idkey, userid);
              return res.redirect(process.env.CLIENT_URI);
            });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        return res.send(err);
      })

  }

  function createStateString() {
    var res = '';
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 16; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return res;
  }

  function authCheck(req, res, next) {
    if (!req.cookies || !req.cookies[idkey]) {
      return res.send('No session')
    }

    User.findById(req.cookies[idkey], function (err, doc) {
      if (err) {
        return res.send(err);
      }
      
      const curTime = new Date().getTime();
      if (curTime > doc.expires) {
        refreshApiToken(doc.refreshToken)
          .then((res) => {
            req.accessToken = res.accessToken;
            next();
          })
      }
      else{
        req.accessToken = doc.accessToken;
        next();
      }
    });
  }

  async function refreshApiToken(refreshToken, userid) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const postQuery = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri: process.env.CALLBACK_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    }

    console.log('Expired API token, refreshing')

    return axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify(postQuery),
      headers
    )
      .then((spotifyKeys) => {
        const keys = { 
          accessToken: spotifyKeys.data.access_token,
          expires: new Date().getTime() + spotifyKeys.data.expires_in
        }

        return User.findByIdAndUpdate(userid, { $set: keys }, upsertOptions, function (err, doc) {
          if (err) {
            return res.send(err);
          }

          console.log('refreshed token');
          return keys.accessToken;
        });
      })
      .catch((err) => {
        return res.send(err);
      });
  }

  return { requestSpotifyAuth, authCallback, authCheck };
}

module.exports = userController;