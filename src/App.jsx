import { useEffect, useState } from "react";
import { loginSpotify, getToken, searchTracks } from "./api/spotify";

function App() {
  const [token, setToken] = useState(null);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);

  // --------------------
  // HANDLE CALLBACK
  // --------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    const exchange = async () => {
      const data = await getToken(code);

      if (data.access_token) {
        setToken(data.access_token);
        window.history.replaceState({}, document.title, "/");
      } else {
        console.error("Token error:", data);
      }
    };

    exchange();
  }, []);

  // --------------------
  // SEARCH
  // --------------------
  const handleSearch = async () => {
    if (!token || !query) return;

    const results = await searchTracks(token, query);
    setTracks(results);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Spotify App 🎵</h1>

      {!token ? (
        <button onClick={loginSpotify}>
          Login with Spotify
        </button>
      ) : (
        <>
          <div style={{ marginTop: "20px" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs..."
              style={{ padding: "8px", width: "250px" }}
            />

            <button onClick={handleSearch} style={{ marginLeft: "10px" }}>
              Search
            </button>
          </div>

          <div style={{ marginTop: "30px" }}>
            {tracks.map((track) => (
              <div key={track.id} style={{ marginBottom: "15px" }}>
                <img
                  src={track.album.images[0]?.url}
                  width="60"
                  alt="cover"
                />
                <div><strong>{track.name}</strong></div>
                <div>
                  {track.artists.map((a) => a.name).join(", ")}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {track.album.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;