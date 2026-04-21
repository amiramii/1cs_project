import { DashboardPageSkeleton } from "@/app/_components/dashboard/DashboardPageSkeleton"

/** Loading UI for all routes under the dashboard layout (main column). */
export default function DashboardSegmentLoading() {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-1 flex-col items-stretch">
      <DashboardPageSkeleton variant="schedule" />
    </div>
  )
}
