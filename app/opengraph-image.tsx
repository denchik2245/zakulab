import { ImageResponse } from "next/og";

export const alt = "Денис Закусилов — сайты для бизнеса под ключ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        color: "#171917",
        background: "#f4f2eb",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 26, fontWeight: 700 }}>
          <div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", color: "#fffef8", background: "#1e46e8", fontSize: 13 }}>ZK</div>
          zakulab
        </div>
        <div style={{ color: "#656861", fontSize: 18 }}>Денис Закусилов · веб-дизайнер</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, lineHeight: .88, letterSpacing: "-6px" }}>
        <span>Сайты, в которых</span>
        <span style={{ color: "#1e46e8", fontFamily: "serif", fontStyle: "italic", fontWeight: 400 }}>бизнес понятен</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 24, borderTop: "2px solid #c8c9c1", color: "#656861", fontSize: 17 }}>
        <span>От задачи и структуры до дизайна и запуска</span>
        <span>zakulab.ru ↗</span>
      </div>
    </div>,
    size,
  );
}
