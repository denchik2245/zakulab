import type { StyleReference } from "@/lib/style-references";

export function StylePreview({ reference }: { reference: StyleReference }) {
  return (
    <div className={`style-preview preview-${reference.preview}`} aria-label={`Стилистический образец: ${reference.title}`}>
      <div className="preview-browser-bar">
        <span /><span /><span />
        <i>visual-reference.local</i>
      </div>
      <div className="preview-canvas">
        {reference.preview === "editorial" && (
          <>
            <div className="pv-nav"><b>FORMA</b><span>Projects&nbsp;&nbsp; Journal&nbsp;&nbsp; About</span></div>
            <strong className="pv-editorial-title">Objects<br /><em>with meaning.</em></strong>
            <div className="pv-editorial-image"><span>01 / 24</span></div>
            <p className="pv-caption">Independent design practice<br />Moscow — Worldwide</p>
          </>
        )}
        {reference.preview === "brutal" && (
          <>
            <div className="pv-brutal-top">NOISE® <span>EST. 2019 ↗</span></div>
            <strong className="pv-brutal-title">MAKE<br />IT LOUD</strong>
            <div className="pv-brutal-sticker">NEW<br />WORK</div>
            <div className="pv-brutal-line">Strategy — Design — Digital — Motion</div>
          </>
        )}
        {reference.preview === "premium" && (
          <>
            <div className="pv-premium-nav"><span>ATELIER 17</span><i>COLLECTION&nbsp;&nbsp; STORY&nbsp;&nbsp; CONTACT</i></div>
            <div className="pv-premium-object"><span /></div>
            <strong className="pv-premium-title">Quiet<br /><em>precision</em></strong>
            <p className="pv-premium-copy">Objects shaped by material, time and light.</p>
          </>
        )}
        {reference.preview === "organic" && (
          <>
            <div className="pv-organic-nav"><b>mellow</b><span>SHOP&nbsp;&nbsp; STORY&nbsp;&nbsp; NOTES</span></div>
            <strong className="pv-organic-title">Daily care,<br />naturally.</strong>
            <div className="pv-organic-shape"><i /><span>BOTANICAL<br />FORMULA</span></div>
            <button>Explore collection →</button>
          </>
        )}
        {reference.preview === "technical" && (
          <>
            <div className="pv-tech-nav"><b>NODE / 04</b><span>INDEX&nbsp;&nbsp; SYSTEM&nbsp;&nbsp; CONTACT</span></div>
            <div className="pv-tech-grid" />
            <strong className="pv-tech-title">ENGINEERED<br />FOR SCALE</strong>
            <div className="pv-tech-data"><span>UPTIME<br /><b>99.98%</b></span><span>REGIONS<br /><b>24</b></span><span>LATENCY<br /><b>42ms</b></span></div>
          </>
        )}
        {reference.preview === "product" && (
          <>
            <div className="pv-product-nav"><b>Flowbase</b><span>Product&nbsp;&nbsp; Solutions&nbsp;&nbsp; Pricing</span><button>Start free</button></div>
            <strong className="pv-product-title">One place for<br />your whole workflow</strong>
            <p className="pv-product-copy">Plan, track and deliver work without losing the big picture.</p>
            <div className="pv-dashboard"><aside><i /><i /><i /><i /></aside><main><span /><div><i /><i /><i /></div></main></div>
          </>
        )}
        {reference.preview === "vivid" && (
          <>
            <div className="pv-vivid-nav"><b>FWD!</b><span>Work&nbsp;&nbsp; Studio&nbsp;&nbsp; Play</span></div>
            <strong className="pv-vivid-title">MOVE<br />PEOPLE</strong>
            <div className="pv-vivid-disc">↗</div>
            <div className="pv-vivid-photo"><span>FEEL FIRST.<br />READ SECOND.</span></div>
          </>
        )}
        {reference.preview === "catalog" && (
          <>
            <div className="pv-catalog-nav"><b>OBJECTS</b><span>Catalog&nbsp;&nbsp; Rooms&nbsp;&nbsp; Brands</span><i>Search&nbsp;&nbsp; Cart (2)</i></div>
            <div className="pv-catalog-filters"><span>All products</span><span>Furniture</span><span>Lighting</span><span>Textile</span></div>
            <div className="pv-products">
              {["A-01", "B-14", "C-07", "D-22", "E-05", "F-18"].map((code, index) => <div key={code}><i className={`product-shape shape-${index}`} /><b>Object {code}</b><span>{12 + index * 7} 900 ₽</span></div>)}
            </div>
          </>
        )}
      </div>
      <span className="preview-label">Стилистический образец · не шаблон</span>
    </div>
  );
}
