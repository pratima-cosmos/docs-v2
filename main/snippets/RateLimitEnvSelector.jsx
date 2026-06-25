import React, { useState } from 'react';
import { RateLimitTable } from './RateLimitTable.jsx';

const ENV_MAP = {
  Dev: 'non-production',
  Staging: 'non-production',
  Prod: 'production',
};

const DEFAULT_APIS = ['Authentication API', 'Management API', 'SCIM API'];

export function RateLimitEnvSelector({ tier, apis = DEFAULT_APIS }) {
  const [selectedEnv, setSelectedEnv] = useState('Prod');

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px',
        marginTop: '4px',
      }}>
        <label style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
          Environment
        </label>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              padding: '5px 32px 5px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Dev">Dev</option>
            <option value="Staging">Staging</option>
            <option value="Prod">Prod</option>
          </select>
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '10px',
            color: 'var(--muted)',
          }}>▾</span>
        </div>
      </div>

      {apis.map((api) => (
        <div key={api} style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>{api}</h3>
          <RateLimitTable tier={tier} api={api} environment={ENV_MAP[selectedEnv]} />
        </div>
      ))}
    </div>
  );
}
