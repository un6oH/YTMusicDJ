const CLIENT_ID = '1018980222004-m7pfvifsgidmr0eenre5epusasm8pvov.apps.googleusercontent.com';

const identity = {};
let loggedIn = false;

function main() {
  document.getElementById('login-btn').onclick = logIn;
  document.getElementById('get-user-playlists').onclick = getUserPlaylists;
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
      } else {
        document.getElementById('result').textContent = 'Error: ' + response.error;
      }
    }
  }).requestAccessToken();
}

const playlistList = document.getElementById('playlists');
function getUserPlaylists() {
  if (myPlaylists) {
    // console.log(myPlaylists);
    const playlists = myPlaylists.items;
    for (let playlist of playlists) {
      // console.log(playlist);
      const line = document.createElement('li');
      const title = document.createElement('h3');
      title.textContent = playlist.snippet.title;
      const description = document.createElement('p');
      description.textContent = playlist.snippet.description;
      line.appendChild(title);
      line.appendChild(description);
      playlistList.appendChild(line);
    }
  } else {

  }
  // fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50', {
  //   headers: {
  //     'Authorization': `Bearer ${identity.access_token}`,
  //     'Accept': 'application/json'
  //   }
  // })
  //   .then(response => response.json())
  //   .then(data => {
  //     console.log(data);

  //     const playlists = data.items;
  //     for (let playlist of playlists) {

  //     }
  //     // data.items is an array of playlist objects
  //   })
  //   .catch(error => {
  //     console.error('Error fetching playlists:', error);
  //   });

}

main();