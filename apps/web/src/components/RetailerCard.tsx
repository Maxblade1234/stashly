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
      className="group block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-400 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <ArrowRight
          size={16}
          className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
        {name}
      </h3>
      <p className="text-xs text-gray-400 mt-0.5">{domain}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          Up to 15% off
        </span>
        <span className="text-xs text-gray-400">{denomRange}</span>
      </div>
    </Link>
  );
}
