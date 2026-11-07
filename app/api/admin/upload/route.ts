import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/automation/auth";
import { db } from "@/lib/automation/db";
import { imageType } from "@/lib/automation/images";

export async function POST(request: NextRequest) {
  const denied=await requireAdmin(request); if (denied) return denied;
  if (Number(request.headers.get("content-length"))>2*1024*1024) return Response.json({error:"2MB 이하 이미지를 사용하세요."},{status:413});
  try {
    const data=Buffer.from(await request.arrayBuffer());
    if (data.length>2*1024*1024) return Response.json({error:"2MB 이하 이미지를 사용하세요."},{status:413});
    const type=imageType(data);
    if (!type) return Response.json({error:"PNG, JPEG, WebP 이미지만 지원합니다."},{status:400});
    const hash=createHash("sha256").update(data).digest("hex");
    await db()`insert into portfolio_images(id,data,content_type) values(${hash},${data},${type}) on conflict(id) do nothing`;
    return Response.json({url:`/api/images/${hash}`});
  } catch { return Response.json({error:"이미지 저장에 실패했습니다."},{status:503}); }
}
