import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';
import './App.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');

  // Init socket once
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setMyId(socket.id);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('roomState', (state) => setGameState(state));

    return () => socket.disconnect();
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ ok: false, error: 'No connection' });
      socketRef.current.emit(event, data, resolve);
    });
  }, []);

  const handleCreateRoom = useCallback(async (name) => {
    const res = await emit('createRoom', { name });
    if (res.ok) setRoomCode(res.code);
    else setError(res.error || 'Failed to create room');
  }, [emit]);

  const handleJoinRoom = useCallback(async (code, name) => {
    const res = await emit('joinRoom', { code, name });
    if (res.ok) setRoomCode(res.code);
    else setError(res.error || 'Failed to join room');
  }, [emit]);

  const handleStartGame = useCallback(() => emit('startGame', { code: roomCode }), [emit, roomCode]);
  const handleNextRound = useCallback(() => emit('nextRound', { code: roomCode }), [emit, roomCode]);
  const handleEndGame = useCallback(() => emit('endGame', { code: roomCode }), [emit, roomCode]);

  const handleUndoTrade = useCallback(() => emit('undoTrade', { code: roomCode }), [emit, roomCode]);

  const handleSubmitQuote = useCallback((bid, ask) =>
    emit('submitQuote', { code: roomCode, bid, ask }), [emit, roomCode]);

  const handleLogTrade = useCallback((buyerId, sellerId, price) =>
    emit('logTrade', { code: roomCode, buyerId, sellerId, price }), [emit, roomCode]);

  const handlePlayAgain = useCallback(() => {
    setRoomCode(null);
    setGameState(null);
  }, []);

  // Derive phase
  const phase = gameState?.phase;
  const isHost = gameState?.hostId === myId;
  const me = gameState?.players?.find(p => p.id === myId);

  if (!connected) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="logo">◈</div>
          <h1>MARKET MAKER</h1>
          <p className="connecting">Connecting to server…</p>
        </div>
      </div>
    );
  }

  if (!roomCode || !gameState) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        error={error}
        setError={setError}
      />
    );
  }

  if (phase === 'ended') {
    return (
      <EndScreen
        gameState={gameState}
        myId={myId}
        me={me}
        isHost={isHost}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <GameScreen
      gameState={gameState}
      myId={myId}
      me={me}
      isHost={isHost}
      roomCode={roomCode}
      onStartGame={handleStartGame}
      onNextRound={handleNextRound}
      onEndGame={handleEndGame}
      onUndoTrade={handleUndoTrade}
      onSubmitQuote={handleSubmitQuote}
      onLogTrade={handleLogTrade}
    />
  );
}