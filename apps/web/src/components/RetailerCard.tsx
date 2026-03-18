import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RetailerCardProps {
  id: string;
  name: string;
  domain: string;
  denominations: number[];
  logoUrl: string | null;
}

export default function RetailerCard({ id, name, domain, denominations, logoUrl }: RetailerCardProps) {
  const minDenom = Math.min(...denominations);
  const maxDenom = Math.max(...denominations);
  const denomRange = denominations.length === 1
    ? `$${minDenom}`
    : `$${minDenom} – $${maxDenom}`;

  return (
    <Link
      href={`/gift-cards/buy?retailer=${id}`}
      className="group block transition-all"
      style={{
        background: 'var(--surface, #FFFFFF)',
        border: '1px solid var(--border, #E8E3DB)',
        borderRadius: 'var(--radius-lg, 20px)',
        padding: '20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 16px rgba(0,0,0,0.06))';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border, #E8E3DB)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 flex items-center justify-center text-xl font-bold overflow-hidden"
          style={{
            borderRadius: 'var(--radius-sm, 12px)',
            backgroundColor: 'rgba(26, 26, 26, 0.04)',
            color: 'var(--text-light, #9A9A9A)',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <ArrowRight
          size={16}
          className="transition-all"
          style={{ color: 'var(--text-light, #9A9A9A)' }}
        />
      </div>
      <h3
        className="text-sm font-bold"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary, #1A1A1A)',
        }}
      >
        {name}
      </h3>
      <p
        className="text-xs mt-0.5"
        style={{ color: 'var(--text-light, #9A9A9A)' }}
      >
        {domain}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="text-xs font-semibold px-2.5 py-0.5"
          style={{
            backgroundColor: 'var(--green-bg, #E8F5E9)',
            color: 'var(--green, #2D7A2F)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            padding: '4px 10px',
          }}
        >
          Up to 15% off
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-light, #9A9A9A)' }}
        >
          {denomRange}
        </span>
      </div>
    </Link>
  );
}
