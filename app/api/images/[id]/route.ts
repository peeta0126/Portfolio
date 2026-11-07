import { db } from "@/lib/automation/db";
import { isAdmin } from "@/lib/automation/auth";

export const dynamic="force-dynamic";
export async function GET(_request: Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(null,{status:404});
  try {
    const [visible]=await db()`select 1 from portfolio_public_snapshot where content::text like ${`%/api/images/${id}%`}`;
    if (!visible && !await isAdmin()) return new Response(null,{status:404});
    const [row]=await db()`select data,content_type from portfolio_images where id=${id}`;
    if (!row) return new Response(null,{status:404});
    return new Response(new Uint8Array(row.data),{headers:{"Content-Type":row.content_type,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
  } catch { return new Response(null,{status:503}); }
}
