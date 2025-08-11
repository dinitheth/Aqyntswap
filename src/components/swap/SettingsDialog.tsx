"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSwapStore } from '@/hooks/use-swap-store';
import { cn } from '@/lib/utils';

const SLIPPAGE_PRESETS = [0.1, 0.5, 1];

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { slippage, setSlippage, deadline, setDeadline } = useSwapStore();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction Settings</DialogTitle>
          <DialogDescription>
            Customize your slippage and transaction deadline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slippage">Slippage Tolerance</Label>
            <div className="flex items-center gap-2">
              {SLIPPAGE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={slippage === preset ? 'default' : 'secondary'}
                  onClick={() => setSlippage(preset)}
                  className={cn(slippage === preset && 'bg-primary text-primary-foreground')}
                >
                  {preset}%
                </Button>
              ))}
              <div className="relative flex-grow">
                <Input
                  id="slippage"
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Transaction Deadline</Label>
            <div className="relative">
              <Input
                id="deadline"
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(parseInt(e.target.value))}
                className="pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">minutes</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
