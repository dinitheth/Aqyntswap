"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ArrowLeft, ChevronsDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { type Token, SOMNIA_ROUTER_ADDRESS, DEFAULT_TOKENS } from '@/lib/constants';
import { routerAbi, pairAbi, erc20Abi } from '@/lib/abi';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const SLIDER_PRESETS = [25, 50, 75, 100];

export function RemoveLiquidityCard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const pairAddress = searchParams.get('pair') as `0x${string}` | undefined;

  const [percentage, setPercentage] = useState(100);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState('0');
  const [amount1, setAmount1] = useState('0');
  
  const { data: poolData, refetch: refetchPoolData } = useReadContracts({
    contracts: [
      { address: pairAddress, abi: pairAbi, functionName: 'token0' },
      { address: pairAddress, abi: pairAbi, functionName: 'token1' },
      { address: pairAddress, abi: pairAbi, functionName: 'balanceOf', args: [address!] },
      { address: pairAddress, abi: pairAbi, functionName: 'getReserves' },
      { address: pairAddress, abi: pairAbi, functionName: 'totalSupply' },
      { address: pairAddress, abi: pairAbi, functionName: 'allowance', args: [address!, SOMNIA_ROUTER_ADDRESS] },
    ],
    query: { enabled: !!address && !!pairAddress }
  });

  const [token0Address, token1Address, lpBalance, reserves, totalSupply, allowance] = poolData?.map(d => d.result) ?? [];

  useEffect(() => {
    if (token0Address && token1Address) {
      setToken0(DEFAULT_TOKENS.find(t => t.address.toLowerCase() === (token0Address as string).toLowerCase()) || null);
      setToken1(DEFAULT_TOKENS.find(t => t.address.toLowerCase() === (token1Address as string).toLowerCase()) || null);
    }

    if (lpBalance && totalSupply && reserves && token0 && token1) {
      const liquidityToRemove = (lpBalance as bigint * BigInt(percentage)) / BigInt(100);
      const amount0Est = ((reserves as any)[0] * liquidityToRemove) / (totalSupply as bigint);
      const amount1Est = ((reserves as any)[1] * liquidityToRemove) / (totalSupply as bigint);
      setAmount0(formatUnits(amount0Est, token0.decimals));
      setAmount1(formatUnits(amount1Est, token1.decimals));
    }
  }, [poolData, percentage, token0, token1, lpBalance, reserves, totalSupply]);

  const { data: approveHash, writeContract: approve, isPending: isApproving } = useWriteContract();
  const { data: removeHash, writeContract: removeLiquidity, isPending: isRemoving } = useWriteContract();
  
  const { isLoading: isConfirmingApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isConfirmingRemove, isSuccess: isRemoveSuccess } = useWaitForTransactionReceipt({ hash: removeHash });

  useEffect(() => {
    if (isApprovalSuccess) {
      toast({ title: 'Approval Successful', description: 'You can now remove liquidity.' });
      refetchPoolData();
    }
    if (isRemoveSuccess) {
      toast({ title: 'Liquidity Removed Successfully' });
      router.push('/pool');
    }
  }, [isApprovalSuccess, isRemoveSuccess, refetchPoolData, router, toast]);

  const handleApprove = () => {
    if (!pairAddress || !lpBalance) return;
    approve({
      address: pairAddress,
      abi: pairAbi,
      functionName: 'approve',
      args: [SOMNIA_ROUTER_ADDRESS, lpBalance as bigint],
    });
  };
  
  const handleRemove = () => {
    if (!pairAddress || !token0 || !token1 || !lpBalance) return;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + 20 * 60;
    const liquidityToRemove = (lpBalance as bigint * BigInt(percentage)) / BigInt(100);
    
    removeLiquidity({
      address: SOMNIA_ROUTER_ADDRESS,
      abi: routerAbi,
      functionName: 'removeLiquidity',
      args: [
        token0.address,
        token1.address,
        liquidityToRemove,
        BigInt(0), // amountAMin
        BigInt(0), // amountBMin
        address!,
        BigInt(deadlineTimestamp)
      ]
    });
  };

  const lpBalanceToRemove = lpBalance ? (lpBalance as bigint * BigInt(percentage)) / BigInt(100) : BigInt(0);
  const needsApproval = allowance !== undefined && (allowance as bigint) < lpBalanceToRemove;
  const isPending = isApproving || isRemoving || isConfirmingApproval || isConfirmingRemove;

  if (!pairAddress || !token0 || !token1) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Pool...</CardTitle></CardHeader>
        <CardContent><Loader2 className="animate-spin" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pool">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardTitle>Remove Liquidity</CardTitle>
        </div>
        <CardDescription>Select the percentage of your liquidity you&apos;d like to remove.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-secondary space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-bold">{percentage}%</h3>
            <div className="flex items-center">
              <Image src={token0.logoURI!} alt={token0.symbol} width={32} height={32} className="rounded-full z-10" data-ai-hint="token logo" />
              <Image src={token1.logoURI!} alt={token1.symbol} width={32} height={32} className="rounded-full -ml-2" data-ai-hint="token logo" />
              <span className="ml-2 font-semibold">{token0.symbol}/{token1.symbol}</span>
            </div>
          </div>
          <Slider value={[percentage]} onValueChange={(value) => setPercentage(value[0])} max={100} step={1} />
          <div className="flex justify-between">
            {SLIDER_PRESETS.map((p) => (
              <Button key={p} variant="ghost" size="sm" onClick={() => setPercentage(p)} className="flex-1">{p}%</Button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <ChevronsDown className="h-6 w-6 text-muted-foreground mx-auto" />
        </div>
        
        <div className="p-4 rounded-lg bg-secondary space-y-3">
            <div className="font-semibold text-sm text-muted-foreground">You will receive</div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Image src={token0.logoURI!} alt={token0.symbol} width={24} height={24} className="rounded-full" data-ai-hint="token logo" />
                    <span>{token0.symbol}</span>
                </div>
                <span className="font-mono">{parseFloat(amount0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Image src={token1.logoURI!} alt={token1.symbol} width={24} height={24} className="rounded-full" data-ai-hint="token logo" />
                    <span>{token1.symbol}</span>
                </div>
                <span className="font-mono">{parseFloat(amount1).toFixed(6)}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {needsApproval && (
              <Button className="w-full text-lg h-12" size="lg" onClick={handleApprove} disabled={isPending}>
                {isApproving || isConfirmingApproval ? <Loader2 className="animate-spin" /> : 'Approve'}
              </Button>
            )}
            <Button 
              className="w-full text-lg h-12" 
              size="lg" 
              onClick={handleRemove} 
              disabled={isPending || needsApproval || percentage === 0}
              style={{ gridColumn: needsApproval ? '1 / -1' : '1 / -1' }}
            >
              {isRemoving || isConfirmingRemove ? <Loader2 className="animate-spin" /> : 'Remove'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
