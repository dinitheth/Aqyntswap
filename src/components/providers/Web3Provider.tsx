"use client";

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider } from 'wagmi';
import { somnia } from '@/lib/somnia';
import { useTheme } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = 'a8024e8d893441a13a8ef5b48554762c'; 

const config = getDefaultConfig({
  appName: 'AqyntSwap',
  projectId,
  chains: [somnia],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, rainbowWallet],
    },
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={theme === 'dark' ? darkTheme({
            accentColor: '#A06CD5',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          }) : lightTheme({
            accentColor: '#A06CD5',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
