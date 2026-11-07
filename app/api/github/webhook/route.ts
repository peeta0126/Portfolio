import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { enqueue } from "@/lib/automation/db";
import { safeEqual } from "@/lib/automation/session";
import { owner } from "@/lib/automation/github";

export const dynamic="force-dynamic";
export async function POST(request: NextRequest) {
  const secret=process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return Response.json({error:"Webhook disabled"},{status:503});
  const raw=await request.text();
  if (raw.length>2000000) return Response.json({error:"Payload too large"},{status:413});
  const expected=`sha256=${createHmac("sha256",secret).update(raw).digest("hex")}`;
  if (!safeEqual(expected,request.headers.get("x-hub-signature-256") ?? "")) return Response.json({error:"Invalid signature"},{status:401});
  const event=request.headers.get("x-github-event");
  if (event==="ping") return Response.json({ok:true});
  if (!["push","repository","installation_repositories"].includes(event ?? "")) return Response.json({ignored:true});
  try {
    const payload=z.object({repository:z.object({owner:z.object({login:z.string()})}).optional(),installation:z.object({account:z.object({login:z.string()})}).optional()}).parse(JSON.parse(raw));
    if ((payload.repository?.owner.login ?? payload.installation?.account.login)?.toLowerCase()!==owner().toLowerCase()) return Response.json({ignored:true});
    await enqueue("discover","discover",{});
    return Response.json({queued:true},{status:202});
  } catch { return Response.json({error:"Webhook processing failed"},{status:503}); }
}
