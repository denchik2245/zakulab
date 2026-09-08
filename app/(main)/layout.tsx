import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { readContent } from "@/lib/content-store";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { site } = await readContent();

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer site={site} />
    </>
  );
}
