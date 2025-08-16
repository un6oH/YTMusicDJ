const identity = {
  access_token: ACCESS_TOKEN
};
let loggedIn = false;

let defaultPlaylists;
let defaultSongs = undefined;
const MAX_SONGS = 5;

let selectedPlaylist;
const songs = [];

const loginBtn = document.getElementById('login-btn');

function main() {
  fetch("playlists.json")
    .then((response) => response.json())
    .then((data) => {
      defaultPlaylists = data;
      console.log('loaded default playlists')
    })
    .catch((error) => console.error("Error loading JSON file", error));
  fetch("songs.json")
    .then((response) => response.json())
    .then((data) => {
      defaultSongs = data;
      console.log('loaded default songs', defaultSongs);
      addSongs(defaultSongs);
    })
    .catch((error) => console.error("Error loading JSON file", error));

  console.log("reloaded.");
  loginBtn.onclick = logIn;
  document.getElementById('get-user-playlists').onclick = getUserPlaylists;
  document.getElementById('get-songs').onclick = loadSongs;
  document.getElementById('analyse-songs').onclick = analyseSongs;
  document.getElementById('clear-songs').onclick = clearSongs;
}

function logIn() {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/youtube.readonly', // Add other scopes as needed
    callback: (response) => {
      console.log(response);
      if (response.access_token) {
        document.getElementById('result').textContent = 'Access Token:\n' + response.access_token;
        loggedIn = true;
        identity.access_token = response.access_token;
        // You can now use the access token to make requests to the YouTube Data API
        
        loginBtn.textContent = `Logged in`
        loginBtn.onclick = logOut;
      } else {
        document.getElementById('result').textContent = 'Error: ' + response.error;
      }
    }
  }).requestAccessToken();
}

function logOut() {

}

const playlistList = document.getElementById('playlists');
function getUserPlaylists() {
  let playlists;
  if (defaultPlaylists) {
    playlists = defaultPlaylists.items;
  } else {
    fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50', {
      headers: {
        'Authorization': `Bearer ${identity.access_token}`,
        'Accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        playlists = data.items;
        // data.items is an array of playlist objects
      })
      .catch(error => {
        console.error('Error fetching playlists:', error);
        return;
      });
  }

  while (playlistList.childElementCount > 0) {
    playlistList.removeChild(playlistList.lastChild);
  }
  for (let playlist of playlists) {
    // console.log(playlist);
    const line = document.createElement('li');
    line.classList.add('list-playlist');
    const title = document.createElement('h3');
    title.textContent = playlist.snippet.title;
    const description = document.createElement('p');
    description.textContent = playlist.snippet.description;
    line.appendChild(title);
    line.appendChild(description);
    line.addEventListener('click', () => {
      selectPlaylist(playlist);
      clearSelections();
      line.classList.add('list-selected');
    });
    playlistList.appendChild(line);
  }
  const items = Array.from(playlistList.children);
}

function clearSelections() {
  Array.from(playlistList.children).forEach(i => i.classList.remove('list-selected'));
}

function selectPlaylist(playlist) {
  selectedPlaylist = playlist;
  console.log(`selected playlist: ${playlist.snippet.title} id: ${playlist.id}`);
}

const songList = document.getElementById('songs');
function loadSongs() {
  if (!selectedPlaylist) {
    console.log("select a playlist first");
    return;
  }
  console.log("fetching songs from youtube");

  fetchSongs([], '');
}

async function fetchSongs(newSongs, nextPageToken) {
  if (!nextPageToken) {
    addSongs(newSongs);
  }

  const url = new URL(`https://www.googleapis.com/youtube/v3/playlistItems`);
  url.search = new URLSearchParams({
    part: 'snippet,contentDetails', 
    playlistId: selectedPlaylist.id, 
    maxResults: '50', 
    pageToken: nextPageToken, 
    key: API_KEY, 
  }).toString();

  fetch(url, {
    header: {
      Authorization: `Bearer ${identity.access_token}`
    }
  }).then((response) => response.json())
    .then((data) => {
      console.log("fetched", data.items.length, "songs");
      fetchSongs(newSongs.concat(data.items), data.nextPageToken);
    })
    .catch(error => {
      console.error('Error fetching songs:', error);
      return;
    });
}

const songCounter = document.getElementById('song-count');
function updateSongCounter() {
  songCounter.textContent = songs.length == 0 ? '' : songs.length.toString();
}

function addSongs(newSongs) {
  for (let song of newSongs) {
    const i = songs.length;

    songs.push(song);
    // console.log(playlist);
    const line = document.createElement('li');
    line.className = 'list-song';
    line.id = song.id;
    const title = document.createElement('h3');
    title.textContent = song.snippet.title;
    const channel = document.createElement('p');
    channel.textContent = song.snippet.videoOwnerChannelTitle;
    // const id = document.createElement('p');
    // id.textContent(song.id);
    const img = document.createElement('img');
    img.src = song.snippet.thumbnails.default.url;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      removeSong(song.id);
    }
    line.appendChild(title);
    line.appendChild(channel);
    line.appendChild(img);
    line.appendChild(removeBtn);
    songList.appendChild(line);
  }
  
  updateSongCounter();
  console.log(`added ${newSongs.length} new songs. playlist length: ${songs.length}`);
}

function removeSong(id) {
  const i = songs.findIndex(song => song.id === id);
  const removed = songs.splice(i, 1);
  console.log("removed song:", removed, "list length:", songs.length);
  document.getElementById(id).remove();
  updateSongCounter();
}

function clearSongs() {
  console.log("songs cleared");
  songs.splice(0, songs.length);
  Array.from(songList.children).forEach(item => item.remove());
  updateSongCounter();
}

function analyseSongs() {
  for (let i = 0; i < songs.length && i < MAX_SONGS; i++) {
    const id = songs[i].id;
    const videoId = songs[i].snippet.resourceId.videoId;

    const url = new URL("http://localhost:3001/analyse");
    url.search = new URLSearchParams({
      id: id, 
      url: "https://youtu.be/" + videoId
    }).toString();

    fetch(url).then((response) => response.json())
      .then((data) => {
        console.log(`analysed song id: ${id}`, "features", data);
      })
      .catch(error => {
        console.error('error analysing song', error);
        return;
      });
  }
}

async function downloadAudio(id, videoId, callback) {
  
}

main();