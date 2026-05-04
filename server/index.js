const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── In-memory state ──────────────────────────────────────────────────────────
const rooms = {}; // roomCode -> room object

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createRoom(hostId, hostName) {
  let code;
  do { code = generateRoomCode(); } while (rooms[code]);

  rooms[code] = {
    code,
    hostId,
    phase: 'lobby',      // lobby | playing | ended
    round: 0,            // 1–4 during play
    players: {},         // socketId -> player
    deck: [],
    communityCards: [],  // all 3 dealt at game start (hidden initially)
    revealedCount: 0,    // how many community cards have been shown
    quotes: {},          // socketId -> { bid, ask }
    trades: [],
    actualTotal: null,
  };
  return rooms[code];
}

function buildDeck() {
  // [-10, 1..15, 20]  = 17 cards
  const deck = [-10, ...Array.from({ length: 15 }, (_, i) => i + 1), 20];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startGame(room) {
  const deck = buildDeck();
  const playerIds = Object.keys(room.players);

  // deal 1 card to each non-host player
  let cardIndex = 0;
  playerIds.forEach((pid) => {
    if (pid === room.hostId) {
      room.players[pid].card = null; // host has no card
    } else {
      room.players[pid].card = deck[cardIndex++];
    }
  });

  // next 3 cards are community
  room.communityCards = deck.slice(cardIndex, cardIndex + 3);
  room.deck = deck;
  room.phase = 'playing';
  room.round = 1;
  room.revealedCount = 0;
  room.quotes = {};
  room.trades = [];
  room.actualTotal = null;
}

function advanceRound(room) {
  if (room.round >= 4) {
    endGame(room);
    return;
  }
  room.round += 1;
  room.revealedCount += 1; // reveal one more community card
}

function endGame(room) {
  room.phase = 'ended';
  room.revealedCount = 3; // show all

  const playerTotal = Object.values(room.players).reduce((sum, p) => sum + (p.card ?? 0), 0);
  const communityTotal = room.communityCards.reduce((sum, c) => sum + c, 0);
  room.actualTotal = playerTotal + communityTotal;

  // calculate P&L per player
  const pnl = {};
  Object.keys(room.players).forEach(pid => { pnl[pid] = 0; });

  room.trades.forEach(trade => {
    const { buyerId, sellerId, price } = trade;
    const total = room.actualTotal;
    if (pnl[buyerId] !== undefined) pnl[buyerId] += (total - price);
    if (pnl[sellerId] !== undefined) pnl[sellerId] += (price - total);
  });

  Object.keys(room.players).forEach(pid => {
    room.players[pid].pnl = pnl[pid] || 0;
  });
}

function getRoomState(room, requestingPlayerId = null) {
  const players = Object.values(room.players).map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    // Only reveal private card to owner, or when game ended
    card: p.card === null ? null : (room.phase === 'ended' || p.id === requestingPlayerId) ? p.card : (p.card !== undefined ? '?' : undefined),
    pnl: room.phase === 'ended' ? p.pnl : undefined,
  }));

  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    hostId: room.hostId,
    players,
    communityCards: room.communityCards.map((card, i) =>
      i < room.revealedCount || room.phase === 'ended' ? card : null
    ),
    revealedCount: room.revealedCount,
    quotes: room.quotes,
    trades: room.trades,
    actualTotal: room.phase === 'ended' ? room.actualTotal : null,
  };
}

function broadcastRoom(room) {
  // Send personalised state to each player
  Object.values(room.players).forEach(player => {
    io.to(player.id).emit('roomState', getRoomState(room, player.id));
  });
}

// ─── Socket events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connect', socket.id);

  // ── Create room
  socket.on('createRoom', ({ name }, cb) => {
    const room = createRoom(socket.id, name);
    room.players[socket.id] = { id: socket.id, name, isHost: true, card: undefined };
    socket.join(room.code);
    cb({ ok: true, code: room.code });
    broadcastRoom(room);
  });

  // ── Join room
  socket.on('joinRoom', ({ code, name }, cb) => {
    const room = rooms[code.toUpperCase()];
    if (!room) return cb({ ok: false, error: 'Room not found' });
    if (room.phase !== 'lobby') return cb({ ok: false, error: 'Game already in progress' });
    if (Object.values(room.players).some(p => p.name === name))
      return cb({ ok: false, error: 'Name already taken' });

    room.players[socket.id] = { id: socket.id, name, isHost: false, card: undefined };
    socket.join(code.toUpperCase());
    cb({ ok: true, code: code.toUpperCase() });
    broadcastRoom(room);
  });

  // ── Start game (host only)
  socket.on('startGame', ({ code }, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Not the host' });
    if (Object.keys(room.players).length < 2)
      return cb && cb({ ok: false, error: 'Need at least 2 players' });

    startGame(room);
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── Submit / update quote
  socket.on('submitQuote', ({ code, bid, ask }, cb) => {
    const room = rooms[code];
    if (!room || room.phase !== 'playing') return cb && cb({ ok: false });
    room.quotes[socket.id] = { bid: Number(bid), ask: Number(ask), playerId: socket.id };
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── Log a trade
  socket.on('logTrade', ({ code, buyerId, sellerId, price }, cb) => {
    const room = rooms[code];
    if (!room || room.phase !== 'playing') return cb && cb({ ok: false });

    const trade = {
      id: Date.now(),
      round: room.round,
      buyerId,
      sellerId,
      price: Number(price),
      timestamp: new Date().toISOString(),
    };
    room.trades.push(trade);
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── Undo last trade (host only)
  socket.on('undoTrade', ({ code }, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false });
    if (room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Not the host' });
    if (room.trades.length === 0) return cb && cb({ ok: false, error: 'No trades to undo' });
    room.trades.pop();
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── Advance round (host only)
  socket.on('nextRound', ({ code }, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false });
    if (room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Not the host' });
    advanceRound(room);
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── End game early (host only)
  socket.on('endGame', ({ code }, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false });
    if (room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Not the host' });
    endGame(room);
    broadcastRoom(room);
    cb && cb({ ok: true });
  });

  // ── Reconnect / rejoin (restore state)
  socket.on('requestState', ({ code, name }, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false });
  
    // re-link player to new socket ID
    if (name) {
      const existing = Object.values(room.players).find(p => p.name === name);
      if (existing) {
        const oldId = existing.id;
        room.players[socket.id] = { ...existing, id: socket.id };
        delete room.players[oldId];
        if (room.hostId === oldId) room.hostId = socket.id;
        if (room.quotes[oldId]) {
          room.quotes[socket.id] = room.quotes[oldId];
          delete room.quotes[oldId];
        }
      }
    }
  
    socket.join(code);
    cb && cb({ ok: true, state: getRoomState(room, socket.id) });
  });

  // ── Disconnect
  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    // Mark player as disconnected but keep their data
    Object.values(rooms).forEach(room => {
      if (room.players[socket.id]) {
        room.players[socket.id].disconnected = true;
        broadcastRoom(room);
      }
    });
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, rooms: Object.keys(rooms).length }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));