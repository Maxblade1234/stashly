'use client';

interface SavedCardPillProps {
  last4: string;
  brand: string;
  isDefault?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}

const brandLabels: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export default function SavedCardPill({
  last4,
  brand,
  isDefault = false,
  selected = false,
  onSelect,
  onRemove,
}: SavedCardPillProps) {
  const brandLabel = brandLabels[brand.toLowerCase()] || brand;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); } : undefined}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">
          {brandLabel}
        </span>
        <span className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-mono)' }}>
          ····{last4}
        </span>
        {isDefault && (
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </div>

      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
