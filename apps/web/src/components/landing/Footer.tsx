'use client';

import Image from 'next/image';

/* ─── Link columns ─── */
const columns = [
  {
    title: 'Pages',
    links: [
      { label: 'Home', href: '#' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Reviews', href: '#reviews' },
    ],
  },
  {
    title: 'Info',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
];

/* ─── Social icons ─── */
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
      <path d="M4.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM1.5 5h3v9h-3V5zm5.5 0h2.8v1.2h.04c.4-.7 1.36-1.45 2.8-1.45C15.3 4.75 16 6.6 16 9.08V14h-3v-4.4c0-1.05-.02-2.4-1.46-2.4-1.46 0-1.69 1.14-1.69 2.32V14H7V5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.52 6.78L15.48 0h-1.41L8.9 5.88 4.76 0H0l6.25 9.1L0 16h1.41l5.46-6.35L11.24 16H16L9.52 6.78zm-1.93 2.25l-.63-.9L2.02 1.04h2.17l4.07 5.82.63.9 5.3 7.58h-2.17l-4.33-6.2z" />
    </svg>
  );
}

const footerStyles = `
  .footer-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 48px;
    margin-bottom: 40px;
  }
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 24px;
    border-top: 1px solid #E8E3DB;
  }
  .footer-card {
    padding: 48px;
  }
  @media (max-width: 768px) {
    .footer-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    .footer-card {
      padding: 28px;
    }
  }
`;

export default function Footer() {
  return (
    <>
      <style>{footerStyles}</style>
      <footer
        style={{
          background: 'var(--bg-sky, #E8EFF7)',
          padding: '0 24px 40px',
        }}
      >
        <div
          className="footer-card"
          style={{
            background: '#fff',
            borderRadius: 20,
            maxWidth: 1280,
            margin: '0 auto',
          }}
        >
          {/* ── Top grid ── */}
          <div className="footer-grid">
            {/* Brand column */}
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <Image
                  src="/images/stashly-icon.png"
                  alt="Stashly"
                  width={26}
                  height={26}
                  style={{ height: 26, width: 'auto' }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--text-primary, #1A1A1A)',
                  }}
                >
                  Stashly
                </span>
              </div>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--text-body, #6B6B6B)',
                  maxWidth: 300,
                  marginTop: 16,
                }}
              >
                Stashly is the smartest way to buy gift cards. Save on every
                purchase with discounted cards from thousands of brands.
              </p>
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary, #1A1A1A)',
                    margin: '0 0 20px',
                  }}
                >
                  {col.title}
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        style={{
                          fontSize: 14,
                          color: 'var(--text-body, #6B6B6B)',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color =
                            'var(--text-primary, #1A1A1A)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color =
                            'var(--text-body, #6B6B6B)';
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Bottom ── */}
          <div className="footer-bottom">
            <span
              style={{
                fontSize: 13,
                color: 'var(--text-light, #9A9A9A)',
              }}
            >
              2026 Stashly. All rights reserved.
            </span>

            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { Icon: LinkedInIcon, label: 'LinkedIn' },
                { Icon: XIcon, label: 'X' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-body, #6B6B6B)',
                    textDecoration: 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      '#EBEBEB';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      '#F5F5F5';
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
