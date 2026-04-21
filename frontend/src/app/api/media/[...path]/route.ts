import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/apiBase"

/**
 * Proxies GET /api/media/... → Django GET {API}/media/...
 * Non-PDF: inline Content-Disposition with filename. PDF: type only (no disposition)
 * so aggressive download managers are less likely to intercept the response.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const relativePath = path.join("/")
  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const search = new URL(request.url).search
  const upstream = `${getApiBaseUrl()}/media/${relativePath}${search}`
  const auth = request.headers.get("authorization")

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstream, {
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        Accept: "*/*",
      },
      cache: "no-store",
    })
  } catch (e) {
    console.error("media proxy fetch:", upstream, e)
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    )
  }

  if (!upstreamRes.ok) {
    const errText = await upstreamRes.text().catch(() => "")
    return NextResponse.json(
      { error: errText || upstreamRes.statusText },
      { status: upstreamRes.status }
    )
  }

  const ct =
    upstreamRes.headers.get("content-type") ?? "application/octet-stream"
  const baseCt = ct.split(";")[0]?.trim().toLowerCase() ?? ""
  const fileName =
    relativePath.split("/").pop()?.replace(/[^\w.\-()[\] ]/g, "_") || "file"

  const headers = new Headers()
  headers.set("Content-Type", ct)
  // PDF: avoid `filename=` in Content-Disposition — download managers (e.g. IDM)
  // often hook that and force a save dialog even when disposition is inline.
  if (!baseCt.includes("pdf")) {
    headers.set(
      "Content-Disposition",
      `inline; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    )
  }

  return new NextResponse(upstreamRes.body, {
    status: 200,
    headers,
  })
}
