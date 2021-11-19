const mongoose = require('mongoose');
const User = require('../models/User');
const { default: axios } = require('axios');
const qs = require('qs');
const urlParse = require('url-parse');

function playlistController(User) {

  async function createPlaylistFromAlbums(req, res) {
    const q = qs.parse(urlParse(req.url).query, { ignoreQueryPrefix: true });
    const playlistName = `Albumize_${getDateYYYYMMDD()}`;

    console.log(`creating playlist for ${req.session.userid}`);

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

    console.log(req.session.userid);

    return axios.post(
      `https://api.spotify.com/v1/users/${req.session.userid}/playlists`,
      query,
      { headers: headers }
    )
      .then((playlistData) => {
        axios.get(
          `https://api.spotify.com/v1/albums?ids=${q.albums}&market=US`,
          { headers: headers }
        )
          .then((albumData) => {
            //albumData.data.albums
            console.log('albums: ');
            console.log(albumData.data.albums);
            var uris = [];
            albumData.data.albums.forEach(album => {
              album.tracks.items.forEach(track => {
                uris.push(track.uri);
              });
            });

            axios.post(
              `https://api.spotify.com/v1/playlists/${playlistData.data.id}/tracks?uris=${uris.join(',')}`,
              {},
              { headers: headers }
            )
              .then((playlist) => {
                console.log(playlistData.data);
                return res.send(playlistData.data.id);
              })
              .catch((err) => {
                return res.send(err);
              })
          })
          .catch((err) => {
            return res.send(err);
          });
      })
      .catch((err) => {
        return res.send(err);
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