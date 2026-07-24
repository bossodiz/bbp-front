import { NextResponse } from "next/server";

/**
 * Redirect the browser straight to the Java backend's ZIP download.
 *
 * The download-result payload can be large (25MB+), which exceeds the Vercel
 * proxy's response limit — so it must NOT go through the /api/* rewrite. This
 * route reads the server-only BACKEND_URL and issues a 302, so the browser
 * fetches the file directly from Railway (browser <-> Railway, bypassing Vercel).
 * The client never needs a public backend URL, keeping BACKEND_URL as the single
 * source of truth.
 *
 * Because this is a cross-origin, top-level navigation, the bbp_auth cookie
 * (bound to the Vercel host) is NOT sent to the backend. The backend must
 * authorize this endpoint by the unguessable jobId, not the session cookie.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "jobId ไม่ถูกต้อง" }, { status: 400 });
  }

  const backend = process.env.BACKEND_URL || "http://localhost:8080";
  const target = `${backend}/api/download/result/${encodeURIComponent(jobId)}`;

  return NextResponse.redirect(target, 302);
}
