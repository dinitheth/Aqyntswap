"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectWallet() {
  return <ConnectButton accountStatus={{
    smallScreen: 'avatar',
    largeScreen: 'full',
  }} />;
}
