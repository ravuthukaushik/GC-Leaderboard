import "./globals.css";

export const metadata = {
  title: "Green Cup Live Command Center",
  description: "Sustainability dashboard for the Green Cup at IIT Bombay."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
