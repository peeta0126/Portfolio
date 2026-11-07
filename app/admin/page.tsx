import type { Metadata } from "next";
import { isAdmin, authConfigured } from "@/lib/automation/auth";
import { AdminDashboard } from "./dashboard";

export const dynamic="force-dynamic";
export const metadata: Metadata={title:"프로젝트 관리",robots:{index:false,follow:false}};
export default async function AdminPage() {
  return <AdminDashboard authenticated={await isAdmin()} configured={authConfigured() && !!process.env.DATABASE_URL} />;
}
