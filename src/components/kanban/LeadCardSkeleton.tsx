import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LeadCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </Card>
  )
}
