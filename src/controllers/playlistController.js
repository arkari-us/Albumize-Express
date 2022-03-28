const mongoose = require('mongoose');
const User = require('../models/User');
const { default: axios } = require('axios');
const qs = require('qs');
const urlParse = require('url-parse');

function playlistController(User) {

  async function createPlaylistFromAlbums(req, res) {
    const q = qs.parse(urlParse(req.url).query, { ignoreQueryPrefix: true });
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

    return axios.post(
      `https://api.spotify.com/v1/users/${req.session.userid}/playlists`,
      query,
      { headers: headers }
    )
      .then(async (playlistData) => {
        var albumPromises = [];
        var uris = [];

        //split the call into sets of 20 (max album fetch per Spotify api)
        for(var i = 0; i < req.body.albums.length / 20; i++) {
          albumPromises.push(axios.get(
            `https://api.spotify.com/v1/albums?ids=${req.body.albums.slice(i * 20, (i+1) * 20)}&market=US`,
            { headers: headers }
          ));
        }

        await Promise.all(albumPromises)
          .then((albumData) => {
            //albumData.data.albums
            albumData.forEach(segment => {
              segment.data.albums.forEach(album => {
                album.tracks.items.forEach(track => {
                  uris.push(track.uri);
                });
              });
            })
          })
          .catch((err) => {
            return res.send(err);
          })

        var playlistPromises = [];
        //split insert into sets of 100 (max playlist insertion per Spotify api)
        for (var i = 0; i < uris.length / 100; i++) {
          playlistPromises.push(axios.post(
            `https://api.spotify.com/v1/playlists/${playlistData.data.id}/tracks?uris=${uris.slice(i * 100, (i+1) * 100).join(',')}`,
            {},
            { headers: headers }
          ));
        }
        Promise.all(playlistPromises)
          .then((data) => {
            return res.send({id: playlistData.data.id});
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
      '-',
      mm,
      '-',
      dd
    ].join('');
  }

  return { createPlaylistFromAlbums }
}

module.exports = playlistController;