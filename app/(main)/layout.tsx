import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { site } = await readContent();

  return (
    <>
      <Header telegramUrl={site.telegramUrl} maxUrl={site.maxUrl} vkUrl={site.vkUrl} />
      <main>{children}</main>
      <Footer site={site} />
    </>
  );
}
