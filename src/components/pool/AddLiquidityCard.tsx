"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSwapStore } from '@/hooks/use-swap-store';
import { TokenInput } from '@/components/swap/TokenInput';
import { TokenSelectDialog } from '@/components/swap/TokenSelectDialog';
import { type Token, SOMNIA_ROUTER_ADDRESS, DEFAULT_TOKENS } from '@/lib/constants';
import { routerAbi, erc20Abi } from '@/lib/abi';
import { useToast } from '@/hooks/use-toast';
import { useTokenBalance } from '@/hooks/use-token-balance';

export function AddLiquidityCard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    deadline,
  } = useSwapStore();
  
  const { balance: tokenInBalance, decimals: tokenInDecimals } = useTokenBalance(tokenIn.address, address);
  const { balance: tokenOutBalance, decimals: tokenOutDecimals } = useTokenBalance(tokenOut.address, address);

  useEffect(() => {
    const token0Address = searchParams.get('token0');
    const token1Address = searchParams.get('token1');

    if (token0Address) {
      const t0 = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase());
      if (t0) setTokenIn(t0);
    }
    if (token1Address) {
      const t1 = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase());
      if (t1) setTokenOut(t1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSelector, setActiveSelector] = useState<'in' | 'out'>('in');

  const { data: allowanceIn, refetch: refetchAllowanceIn } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, SOMNIA_ROUTER_ADDRESS],
    query: { enabled: !!address && !!tokenIn.address },
  });

  const { data: allowanceOut, refetch: refetchAllowanceOut } = useReadContract({
    address: tokenOut.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, SOMNIA_ROUTER_ADDRESS],
    query: { enabled: !!address && !!tokenOut.address },
  });

  const { data: addLiquidityHash, writeContract: addLiquidity, isPending: isAddingLiquidity, error: addLiquidityError } = useWriteContract();
  const { data: approveInHash, writeContract: approveIn, isPending: isApprovingIn, error: approveInError } = useWriteContract();
  const { data: approveOutHash, writeContract: approveOut, isPending: isApprovingOut, error: approveOutError } = useWriteContract();

  const { isLoading: isConfirmingAdd, isSuccess: isAddSuccess } = useWaitForTransactionReceipt({ hash: addLiquidityHash });
  const { isLoading: isConfirmingApprovalIn, isSuccess: isApprovalInSuccess } = useWaitForTransactionReceipt({ hash: approveInHash });
  const { isLoading: isConfirmingApprovalOut, isSuccess: isApprovalOutSuccess } = useWaitForTransactionReceipt({ hash: approveOutHash });
  
  useEffect(() => {
    if (isApprovalInSuccess) {
      toast({ title: `Approved ${tokenIn.symbol}` });
      refetchAllowanceIn();
    }
    if (isApprovalOutSuccess) {
      toast({ title: `Approved ${tokenOut.symbol}` });
      refetchAllowanceOut();
    }
    if (isAddSuccess) {
      toast({ title: "Liquidity Added Successfully" });
      setAmountIn('');
      setAmountOut('');
    }
    if (addLiquidityError) {
      toast({ variant: 'destructive', title: "Add Liquidity Failed", description: addLiquidityError.shortMessage });
    }
    if (approveInError) {
       toast({ variant: 'destructive', title: "Approval Failed", description: approveInError.shortMessage });
    }
    if (approveOutError) {
       toast({ variant: 'destructive', title: "Approval Failed", description: approveOutError.shortMessage });
    }
  }, [isApprovalInSuccess, isApprovalOutSuccess, isAddSuccess, addLiquidityError, approveInError, approveOutError, refetchAllowanceIn, refetchAllowanceOut, setAmountIn, setAmountOut, toast, tokenIn.symbol, tokenOut.symbol]);

  const handleTokenSelect = (token: Token) => {
    if (activeSelector === 'in') {
      if (token.address === tokenOut.address) return; // Prevent selecting the same token
      setTokenIn(token);
    } else {
      if (token.address === tokenIn.address) return; // Prevent selecting the same token
      setTokenOut(token);
    }
    setDialogOpen(false);
  };
  
  const handleApprove = (tokenToApprove: 'in' | 'out') => {
    const amount = tokenToApprove === 'in' ? amountIn : amountOut;
    const token = tokenToApprove === 'in' ? tokenIn : tokenOut;
    const approveFn = tokenToApprove === 'in' ? approveIn : approveOut;

    if (!amount || !token.address) return;

    approveFn({
      address: token.address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [SOMNIA_ROUTER_ADDRESS, parseUnits(amount, token.decimals)]
    });
  };

  const handleSupply = () => {
    if (!amountIn || !amountOut || !tokenIn.address || !tokenOut.address) return;

    const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;
    addLiquidity({
      address: SOMNIA_ROUTER_ADDRESS,
      abi: routerAbi,
      functionName: 'addLiquidity',
      args: [
        tokenIn.address,
        tokenOut.address,
        parseUnits(amountIn, tokenIn.decimals),
        parseUnits(amountOut, tokenOut.decimals),
        0, // amountAMin - setting to 0 for simplicity
        0, // amountBMin - setting to 0 for simplicity
        address!,
        BigInt(deadlineTimestamp),
      ]
    });
  };
  
  const hasSameTokens = tokenIn.address === tokenOut.address;
  const hasInsufficientBalanceIn = amountIn && tokenInBalance !== undefined && tokenInDecimals !== undefined ? parseUnits(amountIn, tokenInDecimals) > tokenInBalance : false;
  const hasInsufficientBalanceOut = amountOut && tokenOutBalance !== undefined && tokenOutDecimals !== undefined ? parseUnits(amountOut, tokenOutDecimals) > tokenOutBalance : false;

  const needsApprovalIn = !!tokenIn.address && allowanceIn !== undefined && amountIn && parseUnits(amountIn, tokenIn.decimals) > allowanceIn;
  const needsApprovalOut = !!tokenOut.address && allowanceOut !== undefined && amountOut && parseUnits(amountOut, tokenOut.decimals) > allowanceOut;

  const isPending = isApprovingIn || isApprovingOut || isAddingLiquidity || isConfirmingAdd || isConfirmingApprovalIn || isConfirmingApprovalOut;
  const isButtonDisabled = 
    isPending || 
    !amountIn || 
    !amountOut || 
    parseFloat(amountIn) <= 0 || 
    parseFloat(amountOut) <= 0 ||
    hasSameTokens ||
    hasInsufficientBalanceIn ||
    hasInsufficientBalanceOut;

  const renderButton = () => {
    if (!address) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Connect Wallet</Button>;
    }
    if (hasSameTokens) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Tokens cannot be the same</Button>;
    }
    if (hasInsufficientBalanceIn) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Insufficient {tokenIn.symbol} balance</Button>;
    }
    if (hasInsufficientBalanceOut) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Insufficient {tokenOut.symbol} balance</Button>;
    }
    if (!tokenIn.address || !tokenOut.address) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Select Tokens</Button>;
    }
    if (needsApprovalIn) {
      return <Button className="w-full text-lg h-12" size="lg" onClick={() => handleApprove('in')} disabled={isPending || !amountIn || parseFloat(amountIn) <= 0}>
        {isApprovingIn || isConfirmingApprovalIn ? <Loader2 className="animate-spin" /> : `Approve ${tokenIn.symbol}`}
      </Button>;
    }
    if (needsApprovalOut) {
      return <Button className="w-full text-lg h-12" size="lg" onClick={() => handleApprove('out')} disabled={isPending || !amountOut || parseFloat(amountOut) <= 0}>
        {isApprovingOut || isConfirmingApprovalOut ? <Loader2 className="animate-spin" /> : `Approve ${tokenOut.symbol}`}
      </Button>;
    }
    return <Button className="w-full text-lg h-12" size="lg" onClick={handleSupply} disabled={isButtonDisabled}>
        {isAddingLiquidity || isConfirmingAdd ? <Loader2 className="animate-spin" /> : 'Supply'}
      </Button>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pool">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle>Add Liquidity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 relative">
            <TokenInput
              token={tokenIn}
              amount={amountIn}
              onAmountChange={setAmountIn}
              onTokenSelect={() => {
                setActiveSelector('in');
                setDialogOpen(true);
              }}
              label="Token 1"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <TokenInput
              token={tokenOut}
              amount={amountOut}
              onAmountChange={setAmountOut}
              onTokenSelect={() => {
                setActiveSelector('out');
                setDialogOpen(true);
              }}
              label="Token 2"
            />
          </div>
          
          {renderButton()}
        </CardContent>
      </Card>
      <TokenSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleTokenSelect}
        currentToken={activeSelector === 'in' ? tokenIn : tokenOut}
        otherSelectedToken={activeSelector === 'in' ? tokenOut : tokenIn}
      />
    </>
  );
}
