import React, { useState, useEffect } from 'react';

export default function QuoteForm({ current, onSubmit }) {
  const [bid, setBid] = useState('');
  const [ask, setAsk] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (current) {
      setBid(current.bid != null ? String(current.bid) : '');
      setAsk(current.ask != null ? String(current.ask) : '');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bid === '' || ask === '') return;
    await onSubmit(Number(bid), Number(ask));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="quote-form">
      <div className="quote-inputs">
        <div className="field">
          <label>Bid (buy at)</label>
          <input
            type="number"
            value={bid}
            onChange={e => setBid(e.target.value)}
            placeholder="0"
            step="0.5"
          />
        </div>
        <div className="quote-divider">↔</div>
        <div className="field">
          <label>Ask (sell at)</label>
          <input
            type="number"
            value={ask}
            onChange={e => setAsk(e.target.value)}
            placeholder="0"
            step="0.5"
          />
        </div>
      </div>
      <button type="submit" className={`btn-primary ${saved ? 'btn-saved' : ''}`}>
        {saved ? '✓ Saved' : current ? 'Update Quote' : 'Post Quote'}
      </button>
    </form>
  );
}
