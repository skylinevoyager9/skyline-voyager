import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — USA travel guides`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(145deg, #0c4a6e 0%, #0f172a 50%, #0d9488 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            SV
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {site.name}
          </span>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {"USA trip ideas & travel guides"}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {site.domain}
        </div>
      </div>
    ),
    { ...size },
  );
}
