import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forex Pulse Copy Trading',
  description: 'Deriv-inspired copy trading dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
