"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useAccount, useReadContracts } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { type Token, SOMNIA_FACTORY_ADDRESS, DEFAULT_TOKENS, USDC, USDT, WSTT } from '@/lib/constants';
import { factoryAbi, pairAbi } from '@/lib/abi';
import { formatUnits }from 'viem';

interface PoolInfo {
  pairAddress: `0x${string}`;
  token0: Token;
  token1: Token;
  userLiquidityUSD: number;
  userPoolShare: number;
  lpTokenBalance: bigint;
}

const getTokenFromAddress = (address: `0x${string}`) => {
  return DEFAULT_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
}

// Very basic price estimation
const calculatePoolUSDValue = (token0: Token, reserve0: bigint, token1: Token, reserve1: bigint) => {
  const r0 = parseFloat(formatUnits(reserve0, token0.decimals));
  const r1 = parseFloat(formatUnits(reserve1, token1.decimals));

  // Prioritize stablecoins for price reference
  if (token0.address === USDC.address || token0.address === USDT.address) {
    return r0 * 2;
  }
  if (token1.address === USDC.address || token1.address === USDT.address) {
    return r1 * 2;
  }
  // Use WSTT as a fallback reference, assuming a mock price (e.g., $1800)
  if (token0.address === WSTT.address) {
      return r0 * 1800 * 2;
  }
  if (token1.address === WSTT.address) {
      return r1 * 1800 * 2;
  }
  
  // If no reference token, we can't determine USD value accurately
  return 0;
};

export function YourPools() {
  const { address, isConnected } = useAccount();

  // 1. Get all pairs length
  const { data: allPairsLengthData, isLoading: isLoadingPairsLength } = useReadContracts({
    contracts: [{
      address: SOMNIA_FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: 'allPairsLength',
    }],
    query: { enabled: isConnected }
  });

  const allPairsLength = allPairsLengthData?.[0].status === 'success' ? allPairsLengthData[0].result : BigInt(0);
  
  // 2. Get all pair addresses
  const { data: allPairsData, isLoading: isLoadingPairs } = useReadContracts({
    contracts: Array.from({ length: Number(allPairsLength) }, (_, i) => ({
      address: SOMNIA_FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: 'allPairs',
      args: [BigInt(i)],
    })),
    query: { enabled: !!allPairsLength && allPairsLength > 0 }
  });
  
  const pairAddresses = allPairsData?.map(d => d.result as `0x${string}`).filter(Boolean) || [];

  // 3. Get user's balance for each pair's LP token
  const { data: lpBalancesData, isLoading: isLoadingBalances } = useReadContracts({
    contracts: pairAddresses.map(pairAddress => ({
      address: pairAddress,
      abi: pairAbi,
      functionName: 'balanceOf',
      args: [address!]
    })),
    query: { enabled: isConnected && pairAddresses.length > 0 }
  });

  const userPoolsAddresses = pairAddresses.filter((_, index) => 
    lpBalancesData?.[index]?.status === 'success' && (lpBalancesData[index].result as bigint) > BigInt(0)
  );
  
  const userLpBalances = lpBalancesData?.map(d => d.result as bigint).filter(b => b > BigInt(0)) || [];

  // 4. Get details for pools the user has liquidity in
  const { data: poolDetailsData, isLoading: isLoadingDetails } = useReadContracts({
    contracts: userPoolsAddresses.flatMap(pairAddress => [
      { address: pairAddress, abi: pairAbi, functionName: 'token0' },
      { address: pairAddress, abi: pairAbi, functionName: 'token1' },
      { address: pairAddress, abi: pairAbi, functionName: 'getReserves' },
      { address: pairAddress, abi: pairAbi, functionName: 'totalSupply' },
    ]),
    query: { enabled: userPoolsAddresses.length > 0 }
  });

  const userPools: PoolInfo[] = [];
  if (poolDetailsData) {
    for (let i = 0; i < userPoolsAddresses.length; i++) {
      const pairAddress = userPoolsAddresses[i];
      const details = poolDetailsData.slice(i * 4, (i + 1) * 4);
      
      if (details.every(d => d.status === 'success')) {
        const [token0Address, token1Address, reserves, totalSupply] = details.map(d => d.result);
        
        const token0 = getTokenFromAddress(token0Address as `0x${string}`) || { name: 'Unknown', symbol: 'TKN0', address: token0Address as `0x${string}`, decimals: 18, logoURI: `https://placehold.co/32x32/cccccc/000000/png?text=TKN` };
        const token1 = getTokenFromAddress(token1Address as `0x${string}`) || { name: 'Unknown', symbol: 'TKN1', address: token1Address as `0x${string}`, decimals: 18, logoURI: `https://placehold.co/32x32/cccccc/000000/png?text=TKN` };
        
        const lpTokenBalance = userLpBalances[i];
        
        let userPoolShare = 0;
        if (totalSupply && (totalSupply as bigint) > 0n) {
          userPoolShare = Number(lpTokenBalance * 10000n / (totalSupply as bigint)) / 100;
        }

        const [reserve0, reserve1] = reserves as [bigint, bigint];
        const totalPoolUSD = calculatePoolUSDValue(token0, reserve0, token1, reserve1);
        const userLiquidityUSD = totalPoolUSD * (userPoolShare / 100);

        userPools.push({
          pairAddress,
          token0,
          token1,
          userLiquidityUSD,
          userPoolShare,
          lpTokenBalance,
        });
      }
    }
  }
  
  const isLoading = isLoadingPairsLength || isLoadingPairs || isLoadingBalances || isLoadingDetails;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Liquidity</CardTitle>
          <CardDescription>Connect your wallet to see your liquidity positions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Your active liquidity positions will appear here.
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Liquidity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (userPools.length === 0) {
    return (
       <Card>
         <CardHeader>
          <CardTitle>Your Liquidity</CardTitle>
          <CardDescription>You don&apos;t have any liquidity positions yet.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center text-muted-foreground">
         Your active liquidity positions will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Liquidity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userPools.map((pool, index) => (
            <div key={index}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <div className="flex -space-x-2 mr-3">
                    <Image src={pool.token0.logoURI!} alt={pool.token0.symbol} width={32} height={32} className="rounded-full border-2 border-background" data-ai-hint="token logo" />
                    <Image src={pool.token1.logoURI!} alt={pool.token1.symbol} width={32} height={32} className="rounded-full border-2 border-background" data-ai-hint="token logo" />
                  </div>
                  <div className="font-semibold">
                    {pool.token0.symbol} / {pool.token1.symbol}
                  </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-sm">Your Liquidity</span>
                      <div className="font-semibold">${pool.userLiquidityUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                     <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-sm">Pool Share</span>
                      <div className="text-sm text-muted-foreground">
                        {pool.userPoolShare.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                <div className="flex justify-start gap-2">
                    <Button asChild className="flex-1">
                        <Link href={`/add?token0=${pool.token0.address}&token1=${pool.token1.address}`}>Add</Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                        <Link href={`/remove?pair=${pool.pairAddress}`}>Remove</Link>
                    </Button>
                </div>
              </div>
              {index < userPools.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
