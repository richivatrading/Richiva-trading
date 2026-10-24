import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Richiva Dashboard',
  description: 'Super Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}