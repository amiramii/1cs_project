import { previewLoadingDelay } from "@/lib/previewLoadingDelay"

export default async function Home() {
  await previewLoadingDelay()
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1>Hello world</h1>
    </div>
  )
}
