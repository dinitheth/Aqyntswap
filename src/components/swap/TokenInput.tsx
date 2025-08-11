"use client";

import Image from 'next/image';
import { ChevronDown, Loader2 } from 'lucide-react';
import { type Token } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount } from 'wagmi';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { parseUnits } from 'viem';

interface TokenInputProps {
  token: Token;
  amount: string;
  onAmountChange: (amount: string) => void;
  onTokenSelect: () => void;
  label: string;
  isAmountReadOnly?: boolean;
  isLoading?: boolean;
}

export function TokenInput({ token, amount, onAmountChange, onTokenSelect, label, isAmountReadOnly = false, isLoading = false }: TokenInputProps) {
  const { address } = useAccount();
  const { formattedBalance, balance, decimals, isLoading: isLoadingBalance } = useTokenBalance(token?.address, address);

  const hasInsufficientBalance = amount && balance !== undefined && decimals !== undefined && !isAmountReadOnly
    ? parseUnits(amount, decimals) > balance
    : false;
  
  return (
    <div className="rounded-xl bg-secondary p-4 space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{label}</span>
        {address && (
          <div className="flex items-center gap-1">
            <span>Balance:</span>
            {isLoadingBalance ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{formattedBalance}</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="flex-1 flex items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Input
            type="text"
            value={amount}
            onChange={(e) => {
              if (!isAmountReadOnly) {
                // Allow empty string and valid numbers
                if (e.target.value === '' || /^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                  onAmountChange(e.target.value)
                }
              }
            }}
            readOnly={isAmountReadOnly}
            placeholder="0.0"
            className="text-2xl h-auto p-0 border-none focus:border-none focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent"
            style={{ boxShadow: 'none', border: 'none' }}
          />
        )}
        <Button variant="ghost" onClick={onTokenSelect} className="h-auto shrink-0 py-2 px-3 rounded-full">
          {token.logoURI && <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full mr-2" data-ai-hint="token logo" />}
          <span className="font-semibold text-lg">{token.symbol}</span>
          <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
        </Button>
      </div>
       {hasInsufficientBalance && (
        <div className="text-xs text-destructive pt-1">
          Insufficient balance
        </div>
      )}
    </div>
  );
}
