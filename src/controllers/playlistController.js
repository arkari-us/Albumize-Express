const mongoose = require('mongoose');
const User = require('../models/User');
const {default: axios } = require('axios');
const qs = require('qs');

function playlistController(User) {

  function createPlaylistFromAlbums(req, res) {
    const playlistName = `Albumize_${getDateYYYYMMDD()}`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.accessToken}`
    }

    const query = {
      name: playlistName,
      description: 'Created by Albumize: http://arkari.us/albumize',
      public: false
    }

    axios.post(
      `https://api.spotify.com/v1/users/${req.session.userid}/playlists`,
      query,
      { headers: headers }
    )
      .then((playlistData) => {
        return res.send(playlistData);
      })
      .catch((err) => {
        return res.send({err: err, data: query, headers: headers});
      });
  }


  function getDateYYYYMMDD() {
    const curDate = new Date();
    
    const yyyy = curDate.getFullYear();
    
    const month = curDate.getMonth() + 1; //month is 0 based
    const mm = (month > 9 ? '' : '0') + month;
    
    const day = curDate.getDate();
    const dd = (day > 9 ? '' : '0') + day;

    return [
      yyyy,
      mm,
      dd
    ].join('');
  }

  return { createPlaylistFromAlbums }
}

module.exports = playlistController;