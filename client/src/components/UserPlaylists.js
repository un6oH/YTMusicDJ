import React, { useState } from 'react';
import { getUserPlayLists } from '../functions/getUserPlaylists';

function UserPlaylists({ accessToken }) {
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setPlaylists(data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <button onClick={fetchPlaylists}>Get My Playlists</button>
      {error && <div>Error: {error}</div>}
      <ul>
        {playlists.map(pl => (
          <li key={pl.id}>{pl.snippet.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserPlaylists;