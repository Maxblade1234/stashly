'use client';

import Image from 'next/image';

const brandsRow1 = [
  { name: 'Apple', src: '/images/brands/apple.png' },
  { name: 'eBay', src: '/images/brands/ebay.png' },
  { name: 'Microsoft', src: '/images/brands/microsoft.png' },
  { name: "Domino's", src: '/images/brands/dominos.png' },
  { name: 'Chipotle', src: '/images/brands/chipotle.png' },
  { name: 'Riot Games', src: '/images/brands/riot-games.png' },
  { name: 'Fanatics', src: '/images/brands/fanatics.png' },
  { name: 'NFL Shop', src: '/images/brands/nfl-shop.png' },
  { name: "Jersey Mike's", src: '/images/brands/jersey-mikes.png' },
  { name: 'OffSeason', src: '/images/brands/off-season.png' },
];

const brandsRow2 = [...brandsRow1].reverse();

function LogoImage({ brand }: { brand: { name: string; src: string } }) {
  const isMicrosoft = brand.name === 'Microsoft';
  const isChipotle = brand.name === 'Chipotle';
  const extraScale = isMicrosoft ? 'scale(2)' : isChipotle ? 'scale(1.5)' : undefined;
  return (
    <Image
      src={brand.src}
      alt={brand.name}
      height={36}
      width={0}
      sizes="auto"
      style={{
        width: 'auto',
        height: '36px',
        opacity: 0.35,
        flexShrink: 0,
        transition: 'opacity 0.3s',
        ...(extraScale ? { transform: extraScale } : {}),
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLImageElement).style.opacity = '0.6';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLImageElement).style.opacity = '0.35';
      }}
    />
  );
}

function MarqueeRow({
  brands,
  direction,
  className,
}: {
  brands: typeof brandsRow1;
  direction: 'left' | 'right';
  className?: string;
}) {
  const doubled = [...brands, ...brands];
  const animationStyle =
    direction === 'left'
      ? { animation: 'scroll-left 35s linear infinite' }
      : { animation: 'scroll-right 35s linear infinite' };

  return (
    <div className={className} style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Left fade gradient */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '120px',
          background: 'linear-gradient(to right, #E8EFF7, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Right fade gradient */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '120px',
          background: 'linear-gradient(to left, #E8EFF7, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          width: 'max-content',
          ...animationStyle,
        }}
      >
        {doubled.map((brand, i) => (
          <LogoImage key={`${brand.name}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}

export default function BrandMarquee() {
  return (
    <section style={{ background: 'transparent', padding: '60px 0', overflow: 'hidden' }}>
      <div style={{ transform: 'rotate(-4deg)', margin: '0 -40px' }}>
        <MarqueeRow brands={brandsRow1} direction="left" />
        <MarqueeRow
          brands={brandsRow2}
          direction="right"
          className="mt-[24px]"
        />
      </div>
    </section>
  );
}
