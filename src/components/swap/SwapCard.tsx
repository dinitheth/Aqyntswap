"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ArrowDown, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSwapStore } from '@/hooks/use-swap-store';
import { useDebounce } from '@/hooks/use-debounce';
import { TokenInput } from './TokenInput';
import { TokenSelectDialog } from './TokenSelectDialog';
import { SettingsDialog } from './SettingsDialog';
import { type Token, SOMNIA_ROUTER_ADDRESS, DEFAULT_TOKENS } from '@/lib/constants';
import { routerAbi, erc20Abi } from '@/lib/abi';
import { useToast } from '@/hooks/use-toast';
import { useTokenBalance } from '@/hooks/use-token-balance';

function useAmountsOut(amountIn: string, tokenIn: Token, tokenOut: Token) {
  const debouncedAmountIn = useDebounce(amountIn, 300);

  const { data: amountsOutData, isLoading } = useReadContract({
    address: SOMNIA_ROUTER_ADDRESS,
    abi: routerAbi,
    functionName: 'getAmountsOut',
    args: [
      debouncedAmountIn ? parseUnits(debouncedAmountIn, tokenIn.decimals) : BigInt(0),
      [tokenIn.address, tokenOut.address]
    ],
    query: {
      enabled: !!debouncedAmountIn && !!tokenIn.address && !!tokenOut.address && parseFloat(debouncedAmountIn) > 0,
      staleTime: 1000 * 10, // 10 seconds
    }
  });

  const amountOut = amountsOutData?.[1] ? formatUnits(amountsOutData[1], tokenOut.decimals) : '';
  
  return { amountOut, isLoading };
}


export function SwapCard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const {
    tokenIn,
    tokenOut,
    amountIn,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    switchTokens,
    slippage,
    deadline,
  } = useSwapStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSelector, setActiveSelector] = useState<'in' | 'out'>('in');
  
  const { amountOut, isLoading: isLoadingAmountOut } = useAmountsOut(amountIn, tokenIn, tokenOut);
  const { balance: tokenInBalance, decimals: tokenInDecimals } = useTokenBalance(tokenIn.address, address);

  useEffect(() => {
    setAmountOut(amountOut);
  }, [amountOut, setAmountOut]);

  // Reset amounts when tokens change
  useEffect(() => {
    setAmountIn('');
    setAmountOut('');
  }, [tokenIn, tokenOut, setAmountIn, setAmountOut]);
  
  const currentAmountOut = useSwapStore(s => s.amountOut);

  const { data: allowance, refetch: refetchAllowance, isFetching: isFetchingAllowance } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, SOMNIA_ROUTER_ADDRESS],
    query: {
      enabled: !!address && !!tokenIn.address,
    },
  });

  const { data: approveHash, writeContract: approve, isPending: isApproving, error: approveError } = useWriteContract();
  const { data: swapHash, writeContract: swap, isPending: isSwapping, error: swapError } = useWriteContract();

  const { isLoading: isConfirmingApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isConfirmingSwap, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

  useEffect(() => {
    if (isApprovalSuccess) {
      toast({ title: "Approval Successful", description: "You can now proceed with the swap." });
      refetchAllowance();
    }
    if (isSwapSuccess) {
      toast({ title: "Swap Successful", description: "Your tokens have been swapped." });
      setAmountIn('');
      refetchAllowance();
    }
    if (approveError) {
      toast({ variant: "destructive", title: "Approval Failed", description: approveError.shortMessage });
    }
    if (swapError) {
      toast({ variant: "destructive", title: "Swap Failed", description: swapError.shortMessage });
    }
  }, [isApprovalSuccess, isSwapSuccess, approveError, swapError, setAmountIn, toast, refetchAllowance]);

  const handleTokenSelect = (token: Token) => {
    const fullToken = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token.address.toLowerCase()) || token;
    if (activeSelector === 'in') {
      if (token.address === tokenOut.address) {
        switchTokens();
      } else {
        setTokenIn(fullToken);
      }
    } else {
      if (token.address === tokenIn.address) {
        switchTokens();
      } else {
        setTokenOut(fullToken);
      }
    }
    setDialogOpen(false);
  };
  
  const handleApprove = () => {
    if (!amountIn || !tokenIn.address) return;
    approve({
      address: tokenIn.address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [SOMNIA_ROUTER_ADDRESS, parseUnits(amountIn, tokenIn.decimals)]
    });
  };

  const handleSwap = () => {
    if (!amountIn || !currentAmountOut || !tokenIn.address || !tokenOut.address) return;

    const amountOutMin = parseUnits((parseFloat(currentAmountOut) * (1 - slippage / 100)).toString(), tokenOut.decimals);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

    swap({
      address: SOMNIA_ROUTER_ADDRESS,
      abi: routerAbi,
      functionName: 'swapExactTokensForTokens',
      args: [
        parseUnits(amountIn, tokenIn.decimals),
        amountOutMin,
        [tokenIn.address, tokenOut.address],
        address!,
        BigInt(deadlineTimestamp)
      ]
    });
  };

  const hasInsufficientBalance = amountIn && tokenInBalance !== undefined && tokenInDecimals !== undefined
    ? parseUnits(amountIn, tokenInDecimals) > tokenInBalance
    : false;

  const needsApproval = !!tokenIn.address && allowance !== undefined && amountIn && parseUnits(amountIn, tokenIn.decimals) > allowance;
  const isPending = isApproving || isSwapping || isConfirmingApproval || isConfirmingSwap;

  const renderButton = () => {
    if (!address) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Connect Wallet</Button>;
    }
    if (hasInsufficientBalance) {
        return <Button className="w-full text-lg h-12" size="lg" disabled>Insufficient {tokenIn.symbol} balance</Button>;
    }
    if (isFetchingAllowance && !isConfirmingApproval) {
      return <Button className="w-full text-lg h-12" size="lg" disabled><Loader2 className="animate-spin" />Loading allowance...</Button>;
    }
    if (!tokenIn.address || !tokenOut.address) {
      return <Button className="w-full text-lg h-12" size="lg" disabled>Select a token</Button>;
    }
    if (needsApproval) {
      return <Button className="w-full text-lg h-12" size="lg" onClick={handleApprove} disabled={isPending || !amountIn}>
        {isApproving || isConfirmingApproval ? <Loader2 className="animate-spin" /> : `Approve ${tokenIn.symbol}`}
      </Button>;
    }
    return <Button className="w-full text-lg h-12" size="lg" onClick={handleSwap} disabled={isPending || !amountIn || !currentAmountOut || parseFloat(amountIn) <= 0}>
      {isSwapping || isConfirmingSwap ? <Loader2 className="animate-spin" /> : 'Swap'}
    </Button>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Swap</CardTitle>
          <SettingsDialog>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </SettingsDialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 relative">
            <TokenInput
              token={tokenIn}
              amount={amountIn}
              onAmountChange={setAmountIn}
              onTokenSelect={() => {
                setActiveSelector('in');
                setDialogOpen(true);
              }}
              label="You pay"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button variant="secondary" size="icon" className="rounded-full" onClick={switchTokens}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <TokenInput
              token={tokenOut}
              amount={isLoadingAmountOut && amountIn ? '' : currentAmountOut}
              onAmountChange={() => {}} // Output amount is calculated
              onTokenSelect={() => {
                setActiveSelector('out');
                setDialogOpen(true);
              }}
              label="You receive"
              isAmountReadOnly
              isLoading={isLoadingAmountOut && !!amountIn}
            />
          </div>
          {currentAmountOut && parseFloat(amountIn) > 0 && <div className="text-sm text-muted-foreground px-1">
            1 {tokenIn.symbol} ≈ { (parseFloat(currentAmountOut) / parseFloat(amountIn)).toFixed(4) } {tokenOut.symbol}
          </div>}
          
          {renderButton()}
        </CardContent>
      </Card>
      <TokenSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleTokenSelect}
        currentToken={activeSelector === 'in' ? tokenIn : tokenOut}
      />
    </>
  );
}
