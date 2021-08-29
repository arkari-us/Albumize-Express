const mongoose = require('mongoose');
const User = require('../models/User');
const { default: axios } = require('axios');
const qs = require('qs');

const stateKey = process.env.STATEKEY;
const idkey = process.env.IDKEY;

function albumController(User) {

  function getNewReleaseAlbums(req, res) {
    getNewReleasePlaylistId(req.accessToken)
      .then((playlistId) => {
        //redirect to playlist by ID handler
        res.redirect('/albums/' + playlistId);
      });
  }

  async function getNewReleasePlaylistId(accessToken) {
    const query = {
      q: 'Release Radar',
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
          throw 'Unable to retrieve Release Radar playlist ID';
        }
      })
      .catch((err) => {
        console.log(err);
        throw 'Unable to retrieve Release Radar playlist ID';
      });
  }

  function getAlbumsByPlaylistId(req, res) {
    const playlistId = req.params.id;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + accessToken
    };

    const postQuery = {
      //TODO
    }

    //TODO: get albums
  }

  function getPlaylistTracks(playlistId) {
    //todo: get playlist tracks
  }

  function getAlbums(tracks) {
    //TODO: get album list for tracks
  }

  return { getNewReleaseAlbums, getAlbumsByPlaylistId };
}

module.exports = albumController;