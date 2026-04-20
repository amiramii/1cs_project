import { DashboardPageSkeleton } from "@/app/_components/dashboard/DashboardPageSkeleton"

export default function StudentSchedulesLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <DashboardPageSkeleton variant="table" />
    </div>
  )
}
