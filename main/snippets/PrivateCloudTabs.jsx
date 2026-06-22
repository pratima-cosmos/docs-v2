'use client';

import { useState } from 'react';

const TIERS = [
  { id: 'tier-dev-private-cloud', label: 'Tier Dev Private Cloud' },
  { id: 'tier-100-rps', label: 'Private Cloud Basic 100 RPS (1x)' },
  { id: 'tier-500-rps', label: 'Private Cloud Performance 500 RPS (5x)' },
  { id: 'tier-1500-rps', label: 'Private Cloud Performance 1,500 RPS (15x)' },
  { id: 'tier-3000-rps', label: 'Private Cloud Performance 3,000 RPS (30x) and 3,000 RPS (30x) Burst' },
  { id: 'tier-6000-rps', label: 'Private Cloud Performance 6,000 RPS (60x) and 6,000 RPS (60x) Burst' },
  { id: 'tier-10000-rps', label: 'Private Cloud Performance 10,000 RPS (100x)' },
];

const TIER_NOTES = {
  'tier-3000-rps': 'The 30x Burst variant has a base sustained capacity of 1,500 RPS with bursts up to 3,000 RPS for up to 80 hours per month. After the monthly allowance is exhausted, traffic is rate-limited to base capacity until the next monthly cycle.',
  'tier-6000-rps': 'The 60x Burst variant has a base sustained capacity of 3,000 RPS with bursts up to 6,000 RPS for up to 80 hours per month. After the monthly allowance is exhausted, traffic is rate-limited to base capacity until the next monthly cycle.',
};

export function PrivateCloudTabs({ RateLimitTable }) {
  const [active, setActive] = useState(TIERS[0].id);
  const [open, setOpen] = useState(false);
  const activeTier = TIERS.find((t) => t.id === active);
  const note = TIER_NOTES[active];

  return (
    <div>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            minWidth: '320px',
            justifyContent: 'space-between',
          }}
        >
          <span>{activeTier.label}</span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M2 4l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            minWidth: '320px',
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            padding: '4px',
          }}>
            {TIERS.map((tier) => {
              const isSelected = tier.id === active;
              return (
                <button
                  key={tier.id}
                  onClick={() => { setActive(tier.id); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: isSelected ? '500' : '400',
                    color: isSelected ? '#6366F1' : '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span>{tier.label}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: '8px' }}>
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#6366F1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {note && (
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
          {note}
        </p>
      )}

      <RateLimitTable tier={active} />
    </div>
  );
}
