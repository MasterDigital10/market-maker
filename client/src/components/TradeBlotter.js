import React from 'react';

export default function TradeBlotter({ trades, playerName }) {
  if (!trades || trades.length === 0) {
    return <p className="muted">No trades yet</p>;
  }

  return (
    <div className="blotter-wrap">
      <table className="blotter-table">
        <thead>
          <tr>
            <th>Rnd</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Price</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {[...trades].reverse().map((t, i) => {
            const time = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <tr key={t.id} className={i === 0 ? 'latest-trade' : ''}>
                <td>{t.round}</td>
                <td>{playerName(t.buyerId)}</td>
                <td>{playerName(t.sellerId)}</td>
                <td className="price-cell">{t.price}</td>
                <td className="time-cell">{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
