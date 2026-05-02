import React from 'react';

export default function EndScreen({ gameState, myId, me, isHost, onPlayAgain }) {
  const { players, communityCards, actualTotal, trades } = gameState;

  const sorted = [...players].filter(p => p.card !== null).sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
  const winner = sorted[0];

  const playerName = (id) => players.find(p => p.id === id)?.name || id;

  return (
    <div className="end-screen">
      <div className="end-card">
        <div className="end-header">
          <span className="logo">◈</span>
          <h1>Game Over</h1>
        </div>

        <section className="reveal-section">
          <h2>Card Reveal</h2>
          <div className="reveal-grid">
          {players.map(p => (
            <div key={p.id} className="reveal-player">
              <span className="reveal-name">{p.name}{p.card === null ? ' ★' : ''}</span>
              {p.card !== null
                ? <div className="card card-revealed">{p.card}</div>
                : <div className="card card-hidden" style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>HOST</div>
              }
            </div>
            ))}
            <div className="reveal-community">
              <span className="reveal-name">Community</span>
              <div className="community-cards">
                {communityCards.map((c, i) => (
                  <div key={i} className="card card-revealed">{c}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="total-banner">
            Total Value: <strong>{actualTotal}</strong>
          </div>
        </section>

        <section className="rankings-section">
          <h2>Rankings</h2>
          <table className="rankings-table">
            <thead>
              <tr><th>Rank</th><th>Player</th><th>P&L</th></tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className={`
                  ${i === 0 ? 'rank-first' : ''}
                  ${p.id === myId ? 'rank-me' : ''}
                `}>
                  <td>{i === 0 ? '🏆' : i + 1}</td>
                  <td>{p.name}{p.id === myId ? ' (you)' : ''}</td>
                  <td className={`pnl-cell ${(p.pnl ?? 0) >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>
                    {(p.pnl ?? 0) >= 0 ? '+' : ''}{p.pnl ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {winner && (
            <div className="winner-banner">
              🏆 {winner.name} wins with P&L of {winner.pnl >= 0 ? '+' : ''}{winner.pnl}!
            </div>
          )}
        </section>

        <section className="trades-section">
          <h2>All Trades</h2>
          {trades.length === 0 ? (
            <p className="muted">No trades were made</p>
          ) : (
            <table className="blotter-table">
              <thead>
                <tr><th>Rnd</th><th>Buyer</th><th>Seller</th><th>Price</th><th>Buyer P&L</th><th>Seller P&L</th></tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id}>
                    <td>{t.round}</td>
                    <td>{playerName(t.buyerId)}</td>
                    <td>{playerName(t.sellerId)}</td>
                    <td>{t.price}</td>
                    <td className={(actualTotal - t.price) >= 0 ? 'pnl-pos' : 'pnl-neg'}>
                      {(actualTotal - t.price) >= 0 ? '+' : ''}{actualTotal - t.price}
                    </td>
                    <td className={(t.price - actualTotal) >= 0 ? 'pnl-pos' : 'pnl-neg'}>
                      {(t.price - actualTotal) >= 0 ? '+' : ''}{t.price - actualTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <button className="btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
