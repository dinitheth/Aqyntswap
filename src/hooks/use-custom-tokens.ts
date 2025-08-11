"use client";

import { type Token } from '@/lib/constants';
import { useLocalStorage } from './use-local-storage';

const CUSTOM_TOKENS_KEY = 'aqyntswap.custom-tokens';

export function useCustomTokens() {
  const [customTokens, setCustomTokens] = useLocalStorage<Token[]>(CUSTOM_TOKENS_KEY, []);

  const addCustomToken = (token: Token) => {
    setCustomTokens((prevTokens) => {
      if (prevTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
        return prevTokens;
      }
      return [...prevTokens, token];
    });
  };
  
  return { customTokens, addCustomToken };
}
