import type { Metadata } from "next";
import { PortfolioPage } from "@/components/portfolio-page";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Портфолио",
  description: "Сайты и интерфейсы, спроектированные Денисом Закусиловым.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const { site } = await readContent();
  return <PortfolioPage site={site} />;
}
