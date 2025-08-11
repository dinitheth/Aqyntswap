import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { YourPools } from '@/components/pool/YourPools';
import { Plus } from 'lucide-react';
import { AllPools } from '@/components/pool/AllPools';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PoolPage() {
  return (
    <div className="container py-4 md:py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold">Pools</h1>
          <Button asChild className="w-auto">
            <Link href="/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Liquidity
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="your-pools">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="your-pools">Your Liquidity</TabsTrigger>
            <TabsTrigger value="all-pools">All Pools</TabsTrigger>
          </TabsList>
          <TabsContent value="your-pools">
            <YourPools />
          </TabsContent>
          <TabsContent value="all-pools">
            <AllPools />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
