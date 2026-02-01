import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tallow',
  description: 'Secure file transfer with post-quantum encryption',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
