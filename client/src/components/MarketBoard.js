import React from 'react';

export default function MarketBoard({ players, quotes }) {
  if (!players || players.length === 0) {
    return <p className="muted">No players yet</p>;
  }

  return (
    <table className="market-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Bid</th>
          <th>Ask</th>
        </tr>
      </thead>
      <tbody>
        {players.filter(p => p.card !== null).map(p => {
          const q = quotes?.[p.id];
          return (
            <tr key={p.id} className={p.disconnected ? 'row-muted' : ''}>
              <td className="player-name-cell">
                {p.name}
                {p.isHost && <span className="host-tag"> ★</span>}
              </td>
              <td className={`bid-cell ${q?.bid != null ? 'has-quote' : ''}`}>
                {q?.bid != null ? q.bid : '—'}
              </td>
              <td className={`ask-cell ${q?.ask != null ? 'has-quote' : ''}`}>
                {q?.ask != null ? q.ask : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
