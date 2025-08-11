"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { type Token, DEFAULT_TOKENS } from '@/lib/constants';
import { erc20Abi } from '@/lib/abi';
import { useCustomTokens } from '@/hooks/use-custom-tokens';
import { useReadContracts } from 'wagmi';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { Badge } from '@/components/ui/badge';

interface TokenSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (token: Token) => void;
  currentToken?: Token;
  otherSelectedToken?: Token;
}

export function TokenSelectDialog({ open, onOpenChange, onSelect, currentToken, otherSelectedToken }: TokenSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { customTokens, addCustomToken } = useCustomTokens();
  const { address: accountAddress } = useAccount();

  const allTokens = useMemo(() => {
    const combined = [...DEFAULT_TOKENS, ...customTokens];
    const uniqueTokens = Array.from(new Map(combined.map(token => [token.address.toLowerCase(), token])).values());
    return uniqueTokens;
  }, [customTokens]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return allTokens;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(lowerCaseQuery) ||
        token.symbol.toLowerCase().includes(lowerCaseQuery) ||
        token.address.toLowerCase() === lowerCaseQuery
    );
  }, [searchQuery, allTokens]);

  const searchedAddress = useMemo(() => {
    if (isAddress(searchQuery) && !allTokens.some(t => t.address.toLowerCase() === searchQuery.toLowerCase())) {
      return searchQuery;
    }
    return null;
  }, [searchQuery, allTokens]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4">
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-0 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {filteredTokens.map((token) => (
              <TokenListItem
                key={token.address}
                token={token}
                onSelect={onSelect}
                isSelected={currentToken?.address.toLowerCase() === token.address.toLowerCase()}
                isOtherSelected={otherSelectedToken?.address.toLowerCase() === token.address.toLowerCase()}
                accountAddress={accountAddress}
              />
            ))}
            {searchedAddress && (
              <SearchedTokenItem 
                address={searchedAddress} 
                onAdd={addCustomToken} 
                onSelect={onSelect}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TokenListItem({ token, onSelect, isSelected, isOtherSelected, accountAddress }: { token: Token; onSelect: (token: Token) => void; isSelected: boolean, isOtherSelected: boolean, accountAddress?: `0x${string}` }) {
  const { formattedBalance, isLoading } = useTokenBalance(token.address, accountAddress);

  return (
    <Button
      variant="ghost"
      className="w-full justify-start h-auto p-2"
      onClick={() => onSelect(token)}
      disabled={isSelected || isOtherSelected}
    >
      <Image src={token.logoURI || ''} alt={token.symbol} width={32} height={32} className="rounded-full mr-3" data-ai-hint="token logo" />
      <div className="flex-grow text-left">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{token.symbol}</div>
          {token.isNative && <Badge variant="secondary">Native</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">{token.name}</div>
      </div>
      <div className="text-right">
        {accountAddress && (
          isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div>{formattedBalance}</div>
        )}
      </div>
    </Button>
  );
}

function SearchedTokenItem({ address, onAdd, onSelect }: { address: `0x${string}`; onAdd: (token: Token) => void; onSelect: (token: Token) => void }) {
  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      { address, abi: erc20Abi, functionName: 'name' },
      { address, abi: erc20Abi, functionName: 'symbol' },
      { address, abi: erc20Abi, functionName: 'decimals' },
    ],
    allowFailure: true
  });

  if (isLoading) return <div className="p-4 text-center"><Skeleton className="h-8 w-full" /></div>;

  if (isError || !data || data.some(d => d.status === 'failure' || d.result === null)) {
    return (
      <div className="p-4 flex items-center justify-center text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 mr-2" /> Not a valid ERC20 token.
      </div>
    );
  }

  const [name, symbol, decimals] = data.map(d => d.result as any);

  const handleAdd = () => {
    const newToken: Token = {
      name,
      symbol,
      address,
      decimals,
      logoURI: `https://placehold.co/32x32/cccccc/000000/png?text=${symbol.substring(0,3)}`,
    };
    onAdd(newToken);
    onSelect( newToken);
  };
  
  return (
    <div className="p-2 border rounded-lg m-2">
      <div className="text-sm text-muted-foreground">Unknown Token</div>
      <div className="flex items-center justify-between mt-1">
        <div>
          <div className="font-bold">{symbol} ({name})</div>
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{address}</div>
        </div>
        <Button onClick={handleAdd}>Add</Button>
      </div>
    </div>
  );
}
