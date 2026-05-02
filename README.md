# ◈ Market Maker — Multiplayer Trading Card Game

A real-time, Kahoot-style trading card game for players in the same room.  
Built with React + Node.js + Socket.IO.

---

## Folder Structure

```
trading-game/
├── server/
│   ├── index.js          ← Express + Socket.IO server (all game logic)
│   └── package.json
├── client/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js        ← Root component + socket setup
│   │   ├── App.css       ← All styles
│   │   ├── index.js      ← React entry point
│   │   ├── components/
│   │   │   ├── Lobby.js       ← Create / join room
│   │   │   ├── GameScreen.js  ← Main game UI
│   │   │   ├── MarketBoard.js ← Live quotes table
│   │   │   ├── TradeBlotter.js← Trade history
│   │   │   ├── QuoteForm.js   ← Submit bid/ask
│   │   │   ├── TradeForm.js   ← Log a trade
│   │   │   └── EndScreen.js   ← Results & P&L
│   │   └── hooks/
│   │       └── useSocket.js
│   └── package.json
└── package.json          ← Convenience scripts
```

---

## Running Locally

### Prerequisites
- Node.js v16+
- npm v8+

### Step 1 — Install dependencies

```bash
# From the trading-game/ root:
cd server && npm install
cd ../client && npm install
```

### Step 2 — Start the server

```bash
cd server
node index.js
# → Server running on port 3001
```

### Step 3 — Start the client (new terminal)

```bash
cd client
npm start
# → Opens http://localhost:3000
```

### Hosted locally

```
# in mac terminal:
ipconfig getifaddr en0 

#---2:
client folder -> new file -> .env
paste inside: REACT_APP_SERVER_URL=http://192.168.1.45:3001 (with actual IP address)

```

---

## How to Play

### Setup
1. **Host** opens the app → clicks "Create Room" → gets a 4-letter code (e.g. `XKCD`)
2. **Other players** open the app on their phones → "Join Room" → enter code + name
3. Host clicks **Start Game** (minimum 2 players)

### Game Flow
- Each player receives 1 private card (keep it secret!)
- 3 community cards dealt face-down
- **4 rounds:**
  - Round 1: No community cards revealed — trade based on your card only
  - Round 2: Host reveals card 1 — adjust your quotes
  - Round 3: Host reveals card 2
  - Round 4: Host reveals final card — last round of trading

### Trading
- **Quotes are indicative** — players shout across the table
- When a verbal deal is agreed, either player logs it via **Log a Trade**
- Select buyer, seller, agreed price → submit

### Winning
- After Round 4, host clicks End Game
- All cards revealed
- **Total Value** = sum of all player cards + all community cards
- **Buyer P&L** = Total Value − Trade Price
- **Seller P&L** = Trade Price − Total Value
- Highest cumulative P&L wins!

---

## Network Setup (Same Room)

For players on phones to connect:

1. Find your computer's local IP:
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig` → look for IPv4
   - Linux: `hostname -I`

2. Set the server URL for the client:
   ```bash
   # In client/.env (create this file):
   REACT_APP_SERVER_URL=http://192.168.1.X:3001
   ```

3. All phones must be on the **same WiFi network**

4. Players open: `http://192.168.1.X:3000` on their phones

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` (server) | `3001` | Server port |
| `REACT_APP_SERVER_URL` (client) | `http://localhost:3001` | Server URL |

---

## Deck Composition

`[-10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20]`  
= 17 cards total. Shuffled randomly each game.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, functional components, hooks |
| Backend | Node.js, Express 4 |
| Real-time | Socket.IO 4 |
| State | In-memory (no database) |
| Styling | Pure CSS (custom properties, responsive) |
