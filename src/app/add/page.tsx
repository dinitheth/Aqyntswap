import { AddLiquidityCard } from '@/components/pool/AddLiquidityCard';

export default function AddLiquidityPage() {
  return (
    <div className="container relative flex-1 items-center justify-center px-4 md:grid md:px-0 lg:max-w-none lg:grid-cols-1">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 py-10 sm:w-[550px]">
        <AddLiquidityCard />
      </div>
    </div>
  );
}
