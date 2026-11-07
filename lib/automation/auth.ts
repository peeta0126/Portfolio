import "server-only";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { validSession } from "./session";

export const cookieName = "portfolio_admin";
export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0)>=32);
}
export async function isAdmin() {
  const value = (await cookies()).get(cookieName)?.value;
  return !!value && validSession(value,process.env.ADMIN_SESSION_SECRET ?? "",process.env.ADMIN_PASSWORD_HASH ?? "");
}
export function sameOrigin(request: NextRequest) {
  const expected = process.env.APP_URL || (process.env.NODE_ENV!=="production" ? request.nextUrl.origin : "");
  return !!expected && request.headers.get("origin") === new URL(expected).origin;
}
export async function requireAdmin(request: NextRequest) {
  if (!await isAdmin()) return Response.json({error:"인증이 필요합니다."},{status:401});
  if (request.method!=="GET" && !sameOrigin(request)) return Response.json({error:"허용되지 않은 요청입니다."},{status:403});
  return null;
}
