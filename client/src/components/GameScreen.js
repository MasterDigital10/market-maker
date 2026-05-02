import React, { useState, useEffect, useRef } from 'react';
import QuoteForm from './QuoteForm';
import TradeForm from './TradeForm';
import MarketBoard from './MarketBoard';
import TradeBlotter from './TradeBlotter';

const ROUND_MINUTES = 3; // non-binding timer duration

function useRoundTimer(round, phase) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_MINUTES * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    setSecondsLeft(ROUND_MINUTES * 60);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [round, phase]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const isWarning = secondsLeft <= 30 && secondsLeft > 0;
  const isExpired = secondsLeft === 0;
  return { display: `${mins}:${secs}`, isWarning, isExpired };
}

export default function GameScreen({
  gameState, myId, me, isHost, roomCode,
  onStartGame, onNextRound, onEndGame, onUndoTrade,
  onSubmitQuote, onLogTrade,
}) {
  const { phase, round, players, communityCards, quotes, trades } = gameState;
  const isLobby = phase === 'lobby';
  const isPlaying = phase === 'playing';
  const myQuote = quotes?.[myId];
  const lastTrade = trades?.length > 0 ? trades[trades.length - 1] : null;
  const timer = useRoundTimer(round, phase);
  const isHostPlayer = isHost; // host is never dealt a card

  const playerName = (id) => players.find(p => p.id === id)?.name || id;

  return (
    <div className="game-layout">
      {/* ── Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo-sm">◈</span>
          <span className="room-code">Room: <strong>{roomCode}</strong></span>
        </div>
        <div className="topbar-center">
          {isPlaying && <span className="round-badge">Round {round} / 4</span>}
          {isLobby && <span className="round-badge lobby-badge">Lobby</span>}
          {isPlaying && (
            <span className={`timer-badge ${timer.isWarning ? 'timer-warning' : ''} ${timer.isExpired ? 'timer-expired' : ''}`}>
              ⏱ {timer.display}
            </span>
          )}
        </div>
        <div className="topbar-right">
          {isPlaying && lastTrade && (
            <span className="last-trade">Last: <strong>{lastTrade.price}</strong></span>
          )}
        </div>
      </header>

      <div className="game-body">
        {/* ── Left panel (market) */}
        <div className="panel-left">
          {/* Community cards */}
          <section className="section">
            <h2 className="section-title">Community Cards</h2>
            <div className="community-cards">
              {isLobby ? (
                <p className="muted">Dealt when game starts</p>
              ) : (
                communityCards.map((card, i) => (
                  <div key={i} className={`card ${card !== null ? 'card-revealed' : 'card-hidden'}`}>
                    {card !== null ? card : '?'}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Market board - quotes */}
          <section className="section">
            <h2 className="section-title">Market Quotes</h2>
            <MarketBoard players={players} quotes={quotes} />
          </section>

          {/* Trade blotter */}
          <section className="section">
            <h2 className="section-title">Trade Blotter</h2>
            <TradeBlotter trades={trades} playerName={playerName} />
          </section>
        </div>

        {/* ── Right panel (player controls) */}
        <div className="panel-right">
          {/* My card — only shown to non-host players */}
          {!isHostPlayer && me?.card !== undefined && me?.card !== null && (
            <section className="section my-card-section">
              <h2 className="section-title">Your Card</h2>
              <div className="my-card">{me.card}</div>
              <p className="muted card-hint">Keep this secret — don't show other players!</p>
            </section>
          )}

          {/* Host label instead of card */}
          {isHostPlayer && isPlaying && (
            <section className="section my-card-section">
              <h2 className="section-title">You are the Host</h2>
              <p className="muted" style={{textAlign:'center', padding:'0.5rem 0'}}>
                You manage the game — no card dealt to you.
              </p>
            </section>
          )}

          {/* Players list (lobby) */}
          {isLobby && (
            <section className="section">
              <h2 className="section-title">Players ({players.length})</h2>
              <ul className="player-list">
                {players.map(p => (
                  <li key={p.id} className="player-item">
                    {p.name}
                    {p.isHost && <span className="host-badge">HOST</span>}
                    {p.disconnected && <span className="dc-badge">away</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quote form — only for non-host players */}
          {isPlaying && !isHostPlayer && (
            <section className="section">
              <h2 className="section-title">Your Quote</h2>
              <QuoteForm current={myQuote} onSubmit={onSubmitQuote} />
            </section>
          )}

          {/* Trade form */}
          {isPlaying && (
            <section className="section">
              <h2 className="section-title">Log a Trade</h2>
              <TradeForm players={players} myId={myId} onSubmit={onLogTrade} />
            </section>
          )}

          {/* Host controls */}
          {isHost && (
            <section className="section host-controls">
              <h2 className="section-title">Host Controls</h2>
              {isLobby && (
                <button className="btn-primary" onClick={onStartGame}
                  disabled={players.length < 2}>
                  {players.length < 2 ? 'Need ≥ 2 players' : 'Start Game'}
                </button>
              )}
              {isPlaying && (
                <div className="host-btn-row">
                  <button className="btn-primary" onClick={onNextRound}>
                    {round < 4 ? `Reveal Card & Start Round ${round + 1}` : 'End Game'}
                  </button>
                  <button
                    className="btn-undo"
                    onClick={onUndoTrade}
                    disabled={!trades || trades.length === 0}
                  >
                    ↩ Undo Last Trade
                  </button>
                  {round < 4 && (
                    <button className="btn-secondary" onClick={onEndGame}>
                      End Game Early
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}