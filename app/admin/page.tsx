import type { Metadata } from "next";
import { AdminStudio } from "@/components/admin-studio";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  const content = authenticated ? await readContent() : null;
  return <AdminStudio authenticated={authenticated} initialContent={content} />;
}
