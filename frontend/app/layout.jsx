import { Inter } from "next/font/google";
import "./globals.css";
import AmbientBackground from "@/components/ambient-background";

// Inter across the whole product — display headings and dense tabular data alike.
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
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
