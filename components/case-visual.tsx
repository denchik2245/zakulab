import type { CaseStudy } from "@/lib/cases";

export function CaseVisual({ item, compact = false }: { item: CaseStudy; compact?: boolean }) {
  return (
    <div className={`case-visual case-${item.accent} ${compact ? "case-compact" : ""}`} aria-hidden="true">
      <div className="case-ui-top">
        <span className="case-dot" />
        <span className="case-ui-name">{item.title}</span>
        <span className="case-ui-menu">{compact ? "VIEW" : "MENU / 04"}</span>
      </div>
      <div className="case-ui-copy">
        <span>{item.index} / CASE</span>
        <strong>
          {item.slug === "alts" && "Сложное — понятно"}
          {item.slug === "ashanti" && "Каталог без хаоса"}
          {item.slug === "seo-roi" && "Рост в фокусе"}
        </strong>
      </div>
      <div className="case-ui-panel">
        <i />
        <i />
        <i />
      </div>
      <div className="case-crosshair">+</div>
    </div>
  );
}
