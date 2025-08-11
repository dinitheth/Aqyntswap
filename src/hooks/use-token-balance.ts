"use client";

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from '@/lib/abi';

export function useTokenBalance(tokenAddress?: `0x${string}`, accountAddress?: `0x${string}`) {
    const { data: balance, isLoading, isError } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [accountAddress!],
        query: {
            enabled: !!accountAddress && !!tokenAddress,
            select: (data) => data, // keep as bigint
        }
    });

    const { data: decimals } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
        query: {
            enabled: !!tokenAddress,
        }
    });

    const formattedBalance = (balance !== undefined && decimals !== undefined)
        ? parseFloat(formatUnits(balance, decimals)).toFixed(4)
        : '0.0000';

    return { balance, formattedBalance, isLoading: isLoading || !decimals, decimals };
}
