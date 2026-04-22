import { useEffect, useState } from "react";
import {
  loginSpotify,
  getToken,
  searchTracks,
  getUser,
  createPlaylist,
  addTracks,
} from "./api/spotify";

import "./App.css";

export default function App() {
  const [token, setToken] = useState(null);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState("NEURAL CORE");

  const [currentTrack, setCurrentTrack] = useState(null);
  const [booting, setBooting] = useState(true);

  // BOOT
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // AUTH
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    const exchange = async () => {
      const data = await getToken(code);

      if (data?.access_token) {
        setToken(data.access_token);
        window.history.replaceState({}, document.title, "/");
      }
    };

    exchange();
  }, []);

  // SEARCH
  const handleSearch = async () => {
    if (!token || !query.trim()) return;
    const results = await searchTracks(token, query);
    setTracks(results || []);
  };

  // ENTER SEARCH
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // SELECT TRACK (NO AUDIO, NO PLAY)
  const selectTrack = (track) => {
    setCurrentTrack(track);
  };

  // DRAG DROP
  const onDrop = (e) => {
    e.preventDefault();
    if (!currentTrack) return;

    setPlaylist((prev) => {
      const exists = prev.find((t) => t.id === currentTrack.id);
      if (exists) return prev;
      return [...prev, currentTrack];
    });
  };

  const removeTrack = (id) => {
    setPlaylist((prev) => prev.filter((t) => t.id !== id));
  };

  // SAVE PLAYLIST (FIXED + SIMPLE)
  const savePlaylist = async () => {
    if (!token || playlist.length === 0) return;

    try {
      const user = await getUser(token);
      const userId = user?.id;

      if (!userId) {
        alert("Failed to get user");
        return;
      }

      const created = await createPlaylist(token, userId, playlistName);

      if (!created?.id) {
        alert("Playlist creation failed");
        return;
      }

      const uris = playlist.map((t) => t.uri).filter(Boolean);

      await addTracks(token, created.id, uris);

      setPlaylist([]);
      alert("PLAYLIST SAVED ✔");
    } catch (err) {
      console.error(err);
      alert("Save failed (check console)");
    }
  };

  // BOOT SCREEN
  if (booting) {
    return (
      <div className="boot-overlay">
        <div style={{ color: "#00e5ff", letterSpacing: "6px" }}>
          INITIALIZING SYSTEM...
        </div>
      </div>
    );
  }

  return (
    <div className="system">

      <div className="grid" />
      <div className="pulse" />

      {/* LOGIN */}
      {!token && (
        <div className="center-connect">
          <button className="connect-btn" onClick={loginSpotify}>
            CONNECT SYSTEM
          </button>
        </div>
      )}

      {/* LEFT SEARCH */}
      {token && (
        <div className="panel left">
          <div className="title">SEARCH</div>

          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs or artists..."
          />

          <button className="btn" onClick={handleSearch}>
            SCAN
          </button>

          <div className="scroll">
            {tracks.map((t) => (
              <div
                key={t.id}
                className="track"
                draggable
                onDragStart={() => setCurrentTrack(t)}
                onClick={() => selectTrack(t)}
              >
                <img
                  src={t.album.images[0]?.url}
                  className="cover"
                />

                <div className="meta">
                  <div className="name">{t.name}</div>
                  <div className="artist">
                    {t.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CENTER (CLEAN FOCUS VIEW) */}
      {token && (
        <div className="center-player">

          {currentTrack ? (
            <>
              <img
                src={currentTrack.album.images[0]?.url}
                className="player-img"
              />

              <div className="player-title">
                {currentTrack.name}
              </div>

              <div className="player-sub">
                {currentTrack.artists.map((a) => a.name).join(", ")}
              </div>
            </>
          ) : (
            <div className="player-empty">
              SELECT TRACK
            </div>
          )}

        </div>
      )}

      {/* RIGHT PLAYLIST */}
      {token && (
        <div
          className="panel right"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="title">{playlistName}</div>

          <input
            className="input"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />

          <button className="btn" onClick={savePlaylist}>
            SAVE PLAYLIST
          </button>

          <div className="scroll">
            {playlist.length === 0 && (
              <div className="empty">DROP TRACKS HERE</div>
            )}

            {playlist.map((t) => (
              <div key={t.id} className="playlist-item">
                <img
                  src={t.album.images[0]?.url}
                  className="cover"
                />

                <div className="meta">
                  <div className="name">{t.name}</div>
                  <div className="artist">
                    {t.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>

                <button
                  className="remove"
                  onClick={() => removeTrack(t.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}