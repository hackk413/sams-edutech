import Link from "next/link";

interface BrandLogoProps {
  href?: string | null;
  size?: "small" | "normal" | "large";
  showSymbol?: boolean;
  className?: string;
}

/**
 * Sams Edutech Official Logo Component
 * - Uses the official emblem (/symbol.png)
 * - Followed by the vertical divider line
 * - Followed by the official transparent PNG wordmark (/sams-wordmark.png)
 * - Perfectly scaled and aligned across mobile, tablet, and desktop
 */
export function BrandLogo({
  href = "/",
  size = "normal",
  showSymbol = true,
  className = "",
}: BrandLogoProps) {
  const content = (
    <div className={`brand-container brand-size-${size} ${className}`} aria-label="Sams Edutech">
      {showSymbol && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/symbol.png"
            alt="Sams Edutech Emblem"
            className="brand-symbol-img"
          />
          <div className="brand-divider" aria-hidden="true" />
        </>
      )}

      {/* Official SAMS EDUTECH Wordmark PNG Graphic */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sams-wordmark.png"
        alt="Sams Edutech"
        className="brand-wordmark-img"
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="brand-link" aria-label="Sams Edutech home">
        {content}
      </Link>
    );
  }

  return content;
}
