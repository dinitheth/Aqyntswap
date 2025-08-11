import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';

import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import { Web3ProviderWrapper } from '@/components/providers/Web3ProviderWrapper';

export const metadata: Metadata = {
  title: 'AqyntSwap',
  description: 'A DEX on the Somnia Shannon Testnet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3ProviderWrapper>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </Web3ProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
