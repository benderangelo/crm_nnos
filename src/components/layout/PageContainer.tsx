import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('max-w-[1600px] mx-auto px-4 md:px-6 py-6', className)}>
      {children}
    </div>
  )
}
