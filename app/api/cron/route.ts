import { NextRequest } from "next/server";
import { enqueue } from "@/lib/automation/db";
import { safeEqual } from "@/lib/automation/session";
import { runOne } from "@/lib/automation/worker";

export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request: NextRequest) {
  const secret=process.env.CRON_SECRET;
  if (!secret || secret.length<32 || !safeEqual(request.headers.get("authorization") ?? "",`Bearer ${secret}`)) return Response.json({error:"Unauthorized"},{status:401});
  try {
    if (request.nextUrl.searchParams.get("mode")!=="work") await enqueue("discover","discover",{});
    return Response.json(await runOne(),{headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Queue unavailable"},{status:503}); }
}
