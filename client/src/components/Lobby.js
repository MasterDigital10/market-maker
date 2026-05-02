import React, { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom, error, setError }) {
  const [tab, setTab] = useState('join'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name');
    if (tab === 'create') {
      onCreateRoom(name.trim());
    } else {
      if (!code.trim()) return setError('Enter room code');
      onJoinRoom(code.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="logo-row">
          <span className="logo">◈</span>
          <div>
            <h1 className="title">MARKET MAKER</h1>
            <p className="subtitle">Multiplayer Trading Card Game</p>
          </div>
        </div>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >Join Room</button>
          <button
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
          >Create Room</button>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="field">
            <label>Your Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={20}
              autoFocus
            />
          </div>

          {tab === 'join' && (
            <div className="field">
              <label>Room Code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. XKCD"
                maxLength={4}
                className="code-input"
              />
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary">
            {tab === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>

        <div className="rules-hint">
          <strong>How it works:</strong> Each player gets a private card. Trade based on incomplete info about the total. 4 rounds — one community card revealed each round.
        </div>
      </div>
    </div>
  );
}
