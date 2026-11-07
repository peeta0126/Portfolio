import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authConfigured, cookieName, sameOrigin } from "@/lib/automation/auth";
import { checkPassword, signSession } from "@/lib/automation/session";
import { db } from "@/lib/automation/db";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({error:"허용되지 않은 요청입니다."},{status:403});
  if (!authConfigured() || !process.env.DATABASE_URL) return NextResponse.json({error:"서버 인증과 DB 설정을 먼저 완료하세요."},{status:503});
  try {
    if (Number(request.headers.get("content-length"))>4096) return NextResponse.json({error:"요청이 너무 큽니다."},{status:413});
    const parsed=z.object({password:z.string().min(1).max(256)}).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error:"비밀번호를 확인하세요."},{status:400});
    // Vercel supplies this header. Outside Vercel, use one shared bucket rather than a spoofable forwarded IP.
    const client = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") ?? "global" : "global";
    const key=createHash("sha256").update(`${process.env.ADMIN_SESSION_SECRET}:${client}`).digest("hex");
    const [attempt]=await db()`insert into admin_attempts(fingerprint,attempts,reset_at) values(${key},1,now()+interval '15 minutes')
      on conflict(fingerprint) do update set attempts=case when admin_attempts.reset_at<now() then 1 else admin_attempts.attempts+1 end,
      reset_at=case when admin_attempts.reset_at<now() then now()+interval '15 minutes' else admin_attempts.reset_at end returning attempts`;
    if (attempt.attempts>5) return NextResponse.json({error:"로그인 시도 한도를 초과했습니다. 15분 후 다시 시도하세요."},{status:429});
    if (!checkPassword(parsed.data.password,process.env.ADMIN_PASSWORD_HASH!)) return NextResponse.json({error:"로그인 정보를 확인하세요."},{status:401});
    const response=NextResponse.json({ok:true});
    response.cookies.set(cookieName,signSession(process.env.ADMIN_SESSION_SECRET!,process.env.ADMIN_PASSWORD_HASH!),{
      httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:8*3600,
    });
    return response;
  } catch { return NextResponse.json({error:"인증 서비스를 사용할 수 없습니다."},{status:503}); }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({error:"허용되지 않은 요청입니다."},{status:403});
  const response=NextResponse.json({ok:true});
  response.cookies.set(cookieName,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
  return response;
}
