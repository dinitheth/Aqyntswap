"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, ArrowRightLeft, Droplets, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectWallet } from './ConnectWallet';
import { ThemeToggle } from './ThemeToggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const navItems = [
  { href: '/', label: 'Swap', icon: ArrowRightLeft },
  { href: '/pool', label: 'Pool', icon: Droplets },
  { href: 'https://somnia.arenas.fi/faucet/', label: 'Faucet', icon: Droplet, external: true },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-6 flex items-center">
          <Link href="/" className="mr-4 flex items-center space-x-2 md:mr-6">
            <Waves className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              AqyntSwap
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm md:gap-4 lg:gap-6">
           <TooltipProvider>
            {navItems.map((item) => (
               <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'transition-colors hover:text-foreground/80 flex items-center gap-2 p-1 rounded-md',
                      pathname === item.href ? 'text-foreground font-semibold bg-secondary' : 'text-foreground/60'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline-block">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            </TooltipProvider>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:block">
            <span className="inline-flex items-center gap-x-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              Somnia Testnet
            </span>
          </div>
          <ConnectWallet />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
