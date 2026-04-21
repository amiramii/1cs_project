import { DashboardPageSkeleton } from "@/app/_components/dashboard/DashboardPageSkeleton"

export default function StudentSchedulesLoading() {
  return (
    <div className="flex w-full min-w-0 max-w-none flex-1 flex-col self-stretch gap-4">
      <DashboardPageSkeleton variant="schedule" />
    </div>
  )
}
