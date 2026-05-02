import React, { useState } from 'react';

export default function TradeForm({ players, myId, onSubmit }) {
  const [buyerId, setBuyerId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [price, setPrice] = useState('');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!buyerId || !sellerId) return setErr('Select buyer and seller');
    if (buyerId === sellerId) return setErr('Buyer and seller must differ');
    if (price === '') return setErr('Enter a price');

    await onSubmit(buyerId, sellerId, Number(price));
    setSaved(true);
    setBuyerId('');
    setSellerId('');
    setPrice('');
    setTimeout(() => setSaved(false), 1500);
  };

  const activePlayers = players.filter(p => !p.disconnected && p.card !== null);

  return (
    <form onSubmit={handleSubmit} className="trade-form">
      <div className="field">
        <label>Buyer</label>
        <select value={buyerId} onChange={e => setBuyerId(e.target.value)}>
          <option value="">— select —</option>
          {activePlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.id === myId ? ' (you)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Seller</label>
        <select value={sellerId} onChange={e => setSellerId(e.target.value)}>
          <option value="">— select —</option>
          {activePlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.id === myId ? ' (you)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Agreed Price</label>
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="e.g. 42"
          step="0.5"
        />
      </div>

      {err && <div className="error-msg">{err}</div>}

      <button type="submit" className={`btn-primary ${saved ? 'btn-saved' : ''}`}>
        {saved ? '✓ Trade Logged' : 'Log Trade'}
      </button>
    </form>
  );
}
