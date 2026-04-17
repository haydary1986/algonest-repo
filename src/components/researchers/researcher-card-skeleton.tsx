import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ResearcherCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="h-1 w-full bg-muted" />
      <CardContent className="flex flex-col items-center gap-4 px-5 pb-5 pt-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="w-full space-y-2 text-center">
          <Skeleton className="mx-auto h-4 w-3/4" />
          <Skeleton className="mx-auto h-3 w-1/2" />
        </div>
        <Skeleton className="mx-auto h-3 w-2/3" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function ResearcherCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ResearcherCardSkeleton key={i} />
      ))}
    </div>
  );
}
