import { DashboardPageSkeleton } from "@/app/_components/dashboard/DashboardPageSkeleton"

export default function JustificationsLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <DashboardPageSkeleton variant="table" />
    </div>
  )
}
