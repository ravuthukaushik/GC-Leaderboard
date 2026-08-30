import { Inter } from "next/font/google";
import "./globals.css";
import TopoBackground from "@/components/topo-background";

// Inter across the whole product - display headings and dense tabular data alike.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata = {
  title: "Green Cup · Sustainability Cell, IIT Bombay",
  description: "The Green Cup sustainability leaderboard for IIT Bombay hostels."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="watercolor" aria-hidden="true" />
        <TopoBackground />
        {children}
      </body>
    </html>
  );
}
