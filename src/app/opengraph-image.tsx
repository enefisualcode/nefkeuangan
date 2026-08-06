import { ImageResponse } from "next/og";

// Gambar pratinjau saat tautan dibagikan (WhatsApp, Telegram, dll).
// Tanpa ini, aplikasi pengirim pesan memakai favicon kecil sebagai gambarnya.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Keuangan — pencatat keuangan pribadi";

const BATANG = [38, 62, 30, 84, 46, 70, 34, 92, 52];

export default function Gambar() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B1220",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              color: "#5A6B88",
              textTransform: "uppercase",
            }}
          >
            Pengeluaran
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 92,
              fontWeight: 800,
              color: "#E9F0FA",
              letterSpacing: -3,
            }}
          >
            Keuangan
          </div>
          <div style={{ marginTop: 14, fontSize: 34, color: "#8C9CB8" }}>
            Catat lewat web atau bot Telegram — datanya menyatu.
          </div>
        </div>

        {/* grafik batang, meniru tampilan dashboard */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 190 }}>
          {BATANG.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 74,
                height: `${t}%`,
                borderRadius: 10,
                background: i === BATANG.length - 2 ? "#54A8FF" : "#FF9A3D",
                opacity: i === BATANG.length - 2 ? 1 : 0.82,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );
}
