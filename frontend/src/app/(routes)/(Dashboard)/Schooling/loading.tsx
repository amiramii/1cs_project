import { DashboardPageSkeleton } from "@/app/_components/dashboard/DashboardPageSkeleton"

export default function SchedualsLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <DashboardPageSkeleton variant="schedule" />
    </div>
  )
}
