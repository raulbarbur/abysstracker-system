import { Skeleton } from "@/components/ui/Skeleton";

export default function PetsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
            <Skeleton className="h-7 w-40 mb-6 rounded-lg" />

            <div className="space-y-4">
              <div>
                <Skeleton className="h-3 w-24 mb-1.5 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1.5 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Skeleton className="h-3 w-32 mb-4 rounded" />
                <div className="mb-4">
                  <Skeleton className="h-3 w-28 mb-1.5 rounded" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div>
                  <Skeleton className="h-3 w-32 mb-1.5 rounded" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>

              <div className="mt-4">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />

          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-card p-4 rounded-2xl shadow-sm border border-border flex justify-between items-start"
              >
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                  {i % 2 === 0 && (
                    <Skeleton className="mt-3 h-8 w-48 rounded-lg opacity-50" />
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end min-w-[80px]">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
