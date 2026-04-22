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
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // BOOT IMMERSION STATE
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // AUTH
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    const exchange = async () => {
      const data = await getToken(code);

      if (data.access_token) {
        setToken(data.access_token);
        window.history.replaceState({}, document.title, "/");
      }
    };

    exchange();
  }, []);

  const handleSearch = async () => {
    if (!token || !query) return;
    const results = await searchTracks(token, query);
    setTracks(results);
  };

  const playTrack = (track) => {
    setCurrentTrack(track);

    if (audio) audio.pause();

    if (track.preview_url) {
      const newAudio = new Audio(track.preview_url);
      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    } else {
      window.open(track.external_urls.spotify, "_blank");
    }
  };

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

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

  const savePlaylist = async () => {
    const user = await getUser(token);
    const created = await createPlaylist(token, user.id, playlistName);

    await addTracks(token, created.id, playlist.map((t) => t.uri));

    setPlaylist([]);
    alert("SYNC COMPLETE ✔");
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
            CONNECT TO NEURAL SYSTEM
          </button>
          <div className="hint">spotify authorization required</div>
        </div>
      )}

      {/* LEFT */}
      {token && (
        <div className="panel left">
          <div className="title">SEARCH NODE</div>

          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks..."
          />

          <button className="btn" onClick={handleSearch}>
            SCAN
          </button>

          <div className="scroll">
            {tracks.map((t) => (
              <div
                key={t.id}
                className="track"
                onClick={() => playTrack(t)}
              >
                <img src={t.album.images[0]?.url} className="cover" />

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

      {/* CENTER PLAYER */}
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

              <div className="controls">
                <button className="ctrl" onClick={togglePlay}>
                  {isPlaying ? "PAUSE" : "PLAY"}
                </button>

                <button
                  className="ctrl"
                  onClick={() =>
                    window.open(currentTrack.external_urls.spotify, "_blank")
                  }
                >
                  OPEN
                </button>
              </div>
            </>
          ) : (
            <div className="player-empty">SELECT TRACK</div>
          )}
        </div>
      )}

      {/* RIGHT */}
      {token && (
        <div className="panel right" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <div className="title">{playlistName}</div>

          <input
            className="input"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />

          <button className="btn" onClick={savePlaylist}>
            SAVE
          </button>

          <div className="scroll">
            {playlist.length === 0 && (
              <div className="empty">DROP HERE</div>
            )}

            {playlist.map((t) => (
              <div key={t.id} className="playlist-item">
                <img src={t.album.images[0]?.url} className="cover" />

                <div className="meta">
                  <div className="name">{t.name}</div>
                  <div className="artist">
                    {t.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>

                <button className="remove" onClick={() => removeTrack(t.id)}>
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