const User = require('../models/User');
const { default: axios } = require('axios');
const qs = require('qs');

const stateKey = process.env.STATEKEY;
const idkey = process.env.IDKEY;

function albumController(User) {

  function getNewReleaseAlbums(req, res) {
    getCuratedPlaylistId(req.accessToken, 'Release Radar')
      .then((playlistId) => {
        getAlbums(playlistId, req.accessToken, req.session.userid)
          .then((data) => {
            return res.status(200).send({ albums: data, status: 200 });
          });
      });
  }

  function getDiscoverWeeklyAlbums(req, res) {
    getCuratedPlaylistId(req.accessToken, 'Discover Weekly')
    .then((playlistId) => {
      getAlbums(playlistId, req.accessToken, req.session.userid)
        .then((data) => {
          return res.status(200).send({ albums: data, status: 200 });
        });
    });
  }

  async function getCuratedPlaylistId(accessToken, playlistName) {
    const query = {
      q: playlistName,
      type: 'playlist',
      limit: 1
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + accessToken
    }

    return axios.get(
      "https://api.spotify.com/v1/search?" + qs.stringify(query), {
      headers: headers
    })
      .then((results) => {
        if (results.data.playlists.items.length) {
          return results.data.playlists.items[0].id;
        }
        else {
          console.log(results)
          throw 'Unable to retrieve Release Radar playlist ID';
        }
      })
      .catch((err) => {
        console.log(err);
        throw 'Unable to retrieve Release Radar playlist ID';
      });
  }

  function getAlbumsByPlaylistId(req, res) {
    getAlbums(req.params.id, req.accessToken)
      .then((data) => {
        return res.status(200).send({ albums: data, status: 200 });
      });
  }

  async function getAlbums(id, accessToken, userid) {

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    };

    const postQuery = {
      fields: 'tracks.items.track.album(album_type,name,id,images,release_date,total_tracks,artists(id,name))'
    };

    return await axios.get(
      'https://api.spotify.com/v1/playlists/' + id + '?' + qs.stringify(postQuery),
      { headers: headers }
    )
      .then((reply) => {
        return getExportedAlbums(userid)
          .then((exportList) => {
            var albums = [];
            reply.data.tracks.items.forEach((e, i) => {
              if (e.track) {
                album = e.track.album;
                album.alreadyExported = exportList.includes(e.track.album.id);
                albums.push(album);
              }
            });

            return albums;
          })
          .catch((err) => {
            console.log(err);
            throw err;
          })
      })
      .catch((err) => {
        console.log(err);
        throw 'Unable to get albums by playlist ID';
      });
  }

  async function getExportedAlbums(userid) {
    return User.findOne({ userid: userid }).exec()
      .then((doc) => {
        return doc.exportList;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });

  }

  return { getNewReleaseAlbums, getDiscoverWeeklyAlbums, getAlbumsByPlaylistId };
}

module.exports = albumController;