import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { BrandLogo } from "@/components/brand-logo";
import { CursorFollower } from "@/components/cursor-follower";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAMS EDUTECH — India's Premier Career Accelerator & Learning Platform",
  description: "Master modern in-demand tech skills, enroll in specialized tracks, and fast-track your tech career with Sams Edutech.",
  icons: {
    icon: [
      { url: "/symbol.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/symbol.png",
    apple: "/symbol.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={manrope.variable}>
      <head>
        <link rel="icon" href="/symbol.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Great+Vibes&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sams-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <CursorFollower />
        <div className="site-shell">
          <AppNav />
          {children}
          <footer className="footer">
            <div className="container footer-content">
              <div className="footer-brand-row">
                <BrandLogo href="/" size="normal" />
                <div className="footer-badges">
                  <span className="recog-badge">Industry Aligned</span>
                  <span className="recog-badge">Student First</span>
                  <span className="recog-badge">24/7 Access</span>
                </div>
              </div>
              <div className="footer-bottom-row">
                <div>&copy; {new Date().getFullYear()} SAMS EDUTECH SOLUTIONS PRIVATE LIMITED. All rights reserved.</div>
                <div className="footer-links">
                  <span>Self-Paced Learning</span>
                  <span>Verified Certifications</span>
                  <span>Career Assistance</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
