# AqyntSwap

AqyntSwap is a feature-rich decentralized exchange (DEX) running on the Somnia Shannon Testnet. It provides a user-friendly interface for swapping tokens and managing liquidity pools.

## Key Features

- **Token Swapping**: Execute token swaps with real-time price updates. The interface is designed to be intuitive, showing you the approximate value you will receive in return.
- **Liquidity Provision**: Add your tokens to liquidity pools to facilitate trades and earn fees on the platform.
- **Pool Management**: View all available liquidity pools or just the ones you are participating in. Easily add more liquidity or remove your existing stake.
- **Wallet Integration**: Connects seamlessly with popular wallets like MetaMask and Rainbow Wallet through RainbowKit.
- **Dark & Light Mode**: A sleek interface with support for both dark and light themes to suit your preference.

## Technology Stack

This project is built with a modern, robust, and type-safe technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain Interaction**:
  - [wagmi](https://wagmi.sh/): For React hooks that interface with Ethereum smart contracts.
  - [viem](https://viem.sh/): A lightweight and efficient TypeScript interface for Ethereum.
- **Wallet Connection**: [RainbowKit](https://www.rainbowkit.com/) for a polished wallet connection experience.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for simple, scalable state management.

## Getting Started

To get a local copy of AqyntSwap up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

### Get Testnet Tokens

To interact with the DEX, you will need Somnia Test Tokens (WSTT) and other testnet ERC20 tokens. You can get these from the Somnia faucet. A "Faucet" link is conveniently located in the application's header.
