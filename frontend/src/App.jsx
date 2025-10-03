import React, { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/pricing', { credentials: 'include' })
      .then(r => r.json())
      .then(setPricing)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!pricing) return <div>Loading...</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Pricing (version: {pricing.version})</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {pricing.plans.map((p) => (
          <div key={p.name} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <h3>{p.name}</h3>
            <p style={{ fontSize: 18, fontWeight: 600 }}>${p.price}</p>
            <ul>
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}