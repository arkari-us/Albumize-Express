const urlParse = require('url-parse');
const qs = require('qs');
const { default: axios } = require('axios');

const stateKey = 'state';
const idkey = 'id';
const usernameKey = 'username';

const upsertOptions = {
  upsert: true,
  useFindAndModify: false
}

function userController(User) {

  function requestSpotifyAuth(req, res) {
    const state = createStateString()
    const query = qs.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: 'playlist-read-private user-read-private',
      redirect_uri: process.env.CALLBACK_URI,
      state: state
    });

    res.cookie(stateKey, state, { secure: true, httponly: true, path: '/albumize', domain:'arkari.us' });
    res.redirect('https://accounts.spotify.com/authorize?' + query);
  }

  function authCallback(req, res) {
    const query = qs.parse(urlParse(req.url).query, { ignoreQueryPrefix: true });

    if (!req.cookies || !req.cookies[stateKey] || !query || !query.state || req.cookies[stateKey] !== query.state) {
      return res.status(400).send({ err: 'State mismatch', status: 400 });
    }

    res.clearCookie(stateKey);
    authCode = query.code;

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
        //get user id (to be used as mongodb _id) and username (to display on front end)
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
            const username = profile.data.display_name;

            const keys = {
              username: username,
              refreshToken: spotifyKeys.data.refresh_token,
              accessToken: spotifyKeys.data.access_token,
              expires: new Date().getTime() + spotifyKeys.data.expires_in
            }

            //upsert user
            User.findByIdAndUpdate(userid, { $set: keys }, upsertOptions, function (err, doc) {
              if (err) {
                return res.status(500).send({ err: err, status: 500 });
              }
              req.session.userid = userid;
              req.session.username = username;

              res.cookie(usernameKey, username);
              return res.redirect(process.env.CLIENT_URI);
            });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        return res.status(500).send({ err: err, status: 500 });
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
    if (!req.session || !req.session.userid) {
      return res.status(401).send({ err: 'No session', status: 401 });
    }

    User.findById(req.session.userid, function (err, doc) {
      if (err) {
        return res.status(500).send({ err: err, status: 500 });
      }

      const curTime = new Date().getTime();
      if (curTime > doc.expires) {
        refreshApiToken(doc.refreshToken, req.session.userid)
          .then((res) => {
            req.accessToken = res.accessToken;
            next()
          });
      }
      else {
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

    console.log('Expired API token, refreshing');

    return axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify(postQuery),
      headers
    )
      .then((spotifyKeys) => {
        const keys = {
          accessToken: spotifyKeys.data.access_token,
          expires: new Date().getTime() / 1000 + spotifyKeys.data.expires_in
        }

        return User.findByIdAndUpdate(userid, { $set: keys }, upsertOptions, function (err, doc) {
          if (err) {
            return err;
          }

          console.log('refreshed token');
          return keys.accessToken;
        });
      });
  }

  return { requestSpotifyAuth, authCallback, authCheck };
}

module.exports = userController;