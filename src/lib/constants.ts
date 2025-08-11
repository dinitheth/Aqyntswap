
export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}

export const WSTT: Token = {
  name: "Somnia Test Token",
  symbol: "WSTT",
  address: "0xF22eF0085f6511f70b01a68F360dCc56261F768a",
  decimals: 18,
  logoURI: "https://placehold.co/32x32/A06CD5/FFFFFF/png?text=WSTT",
};

export const WETH: Token = {
  name: "Wrapped Ether",
  symbol: "WETH",
  address: "0xdd8f41bf80d0E47132423339ca06bC6413da96b5",
  decimals: 18,
  logoURI: "https://placehold.co/32x32/7d7d7d/FFFFFF/png?text=WETH",
};

export const USDT: Token = {
  name: "Tether USD",
  symbol: "USDT",
  address: "0xAe5b5C30003ef1F8eAE9E00e79c6CCa7D48E6e8A",
  decimals: 6,
  logoURI: "https://placehold.co/32x32/26A17B/FFFFFF/png?text=USDT",
};

export const USDC: Token = {
  name: "USD Coin",
  symbol: "USDC",
  address: "0x833A00575F39037403006A822C3fd7AD9abFF32C",
  decimals: 6,
  logoURI: "https://placehold.co/32x32/2775CA/FFFFFF/png?text=USDC",
};

export const WBTC: Token = {
  name: "Wrapped Bitcoin",
  symbol: "WBTC",
  address: "0xE3233Ee6E373Be04277a435facc262E7A9c46151",
  decimals: 8,
  logoURI: "https://placehold.co/32x32/F7931A/FFFFFF/png?text=WBTC",
};

export const DEFAULT_TOKENS: Token[] = [WSTT, WETH, USDT, USDC, WBTC];

export const SOMNIA_ROUTER_ADDRESS = "0x3396dABE6634054D109AeAb91DDE4f1d3f63dC6B";
export const SOMNIA_FACTORY_ADDRESS = "0xfC9F7c3402422D596767306137Ac80cC67f7c870";
