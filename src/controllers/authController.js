const mongoose = require('mongoose');

function userController() {
  function requestSpotifyAuth(req, res) {

    res.redirect('https://accounts.spotify.com/authorize?' +
                'response_type=code&' +
                'client_id=' + process.env.SPOTIFY_CLIENT +
                'scope=playlist-read-private&' +
                'redirect_uri=' + process.env.SPOTIFY_AUTH_CALLBACK)
  }

  function authCallback(User) {

  }

  return { requestSpotifyAuth, authCallback };
}

module.exports = userController;