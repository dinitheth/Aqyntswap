import { create } from 'zustand';
import { type Token, WSTT, USDC, DEFAULT_TOKENS } from '@/lib/constants';

interface SwapState {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  slippage: number;
  deadline: number;
  setTokenIn: (token: Token) => void;
  setTokenOut: (token: Token) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: string) => void;
  switchTokens: () => void;
  setSlippage: (slippage: number) => void;
  setDeadline: (deadline: number) => void;
}

const findToken = (symbol: string) => DEFAULT_TOKENS.find(t => t.symbol === symbol)!;

export const useSwapStore = create<SwapState>((set) => ({
  tokenIn: findToken('WSTT'),
  tokenOut: findToken('USDC'),
  amountIn: '',
  amountOut: '',
  slippage: 0.5,
  deadline: 20,
  setTokenIn: (token) => set({ tokenIn: token }),
  setTokenOut: (token) => set({ tokenOut: token }),
  setAmountIn: (amount) => set({ amountIn: amount }),
  setAmountOut: (amount) => set({ amountOut: amount }),
  switchTokens: () => set((state) => ({ 
    tokenIn: state.tokenOut, 
    tokenOut: state.tokenIn,
    amountIn: '', // Reset amountIn to trigger re-calculation
    amountOut: ''  // Reset amountOut
  })),
  setSlippage: (slippage) => set({ slippage }),
  setDeadline: (deadline) => set({ deadline }),
}));
