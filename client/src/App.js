import logo from './logo.svg';
import './App.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginComponent from './components/login';
import { useState } from 'react';
import UserPlaylists from './components/UserPlaylists';

function App() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  function checkUserData() {
    console.log(user);
    console.log(accessToken);
  }

  return (
    <body>
      <h1>YouTube Music DJ</h1>
      <GoogleLoginComponent />
      <input type='text' placeholder='Playlist link'/>
      <input type='text' placeholder='Search for playlists'/>
      <button onClick={checkUserData}>Check user data</button>
      <UserPlaylists />
    </body>
  );
}

export default App;
