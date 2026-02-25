import { NextRequest, NextResponse } from "next/server";
import {
  authContextHeaders,
  requireToken,
  verifyToken,
} from "@/app/lib/auth";

const unauthorized = (reason: string) =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function proxy(req: NextRequest) {
  // worker requests are verified seperately with qstash wrapper
  if (req.nextUrl.pathname.startsWith("/api/worker/")) {
    return NextResponse.next()
  }

  let token: string;
  try {
    token = await requireToken(req);
  } catch {
    return unauthorized("Missing token");
  }

  try {
    const auth = await verifyToken(token);

    const headersWithAuth = authContextHeaders(auth, req.headers);
    return NextResponse.next({
      request: {
        headers: headersWithAuth,
      },
    });
  } catch {
    return unauthorized("Invalid token");
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
