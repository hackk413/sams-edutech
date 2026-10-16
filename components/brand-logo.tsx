import Link from "next/link";

interface BrandLogoProps {
  href?: string | null;
  size?: "small" | "normal" | "large";
  showSymbol?: boolean;
  className?: string;
}

/**
 * Sams Edutech Official Logo Component
 * - Styled precisely to match the official corporate identity:
 *   1. Double-curved blue ribbon emblem with pixel accents on left
 *   2. Orange vertical divider
 *   3. Modern bold blue "SAMS" wordmark
 *   4. Pixel color-block grid (orange & blue) placed precisely at the top-right of SAMS
 *   5. Clean uppercase "EDUTECH" subline in vibrant orange
 *   6. NO laptop icon beside the wordmark
 */
export function BrandLogo({
  href = "/",
  size = "normal",
  showSymbol = true,
  className = "",
}: BrandLogoProps) {
  const symbolHeights = {
    small: "34px",
    normal: "48px",
    large: "60px",
  };

  const samsFontSizes = {
    small: "1.15rem",
    normal: "1.45rem",
    large: "1.85rem",
  };

  const edutechFontSizes = {
    small: "0.52rem",
    normal: "0.64rem",
    large: "0.80rem",
  };

  const content = (
    <div className={`brand-container brand-size-${size} ${className}`} aria-label="Sams Edutech">
      {showSymbol && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/symbol.png"
            alt="Sams Edutech Emblem"
            className="brand-symbol-img"
            style={{ height: symbolHeights[size], width: "auto", objectFit: "contain" }}
          />
          <div className="brand-divider" aria-hidden="true" />
        </>
      )}

      <div className="brand-wordmark">
        <div className="brand-row-sams">
          <span
            className="brand-sams-text"
            style={{ fontSize: samsFontSizes[size] }}
          >
            SAMS
          </span>
          {/* Color blocks cluster placed immediately beside the last letter S of SAMS */}
          <span className="brand-pixel-cluster" aria-hidden="true">
            <span className="px-block px-orange" />
            <span className="px-block px-blue" />
            <span className="px-block px-blue" />
            <span className="px-block px-orange" />
          </span>
        </div>

        <div
          className="brand-row-edutech"
          style={{ fontSize: edutechFontSizes[size] }}
        >
          EDUTECH
        </div>
      </div>
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
