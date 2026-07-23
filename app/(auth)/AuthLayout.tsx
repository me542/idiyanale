"use client";

import Image from "next/image";

export const BRAND_GREEN = "#1B5E3B";

export function BrandPanel() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BRAND_GREEN,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <Image
        src="/images/idiyanale.png"
        alt="Idiyanale"
        width={180}
        height={180}
        loading="eager"
      />
      <p
        style={{
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: "0.2em",
          marginTop: 24,
          background: "linear-gradient(180deg, #E5CA7F 0%, #896C38 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        IDIYANALE
      </p>
    </div>
  );
}

export function Card({
  children,
  maxWidth = 1000,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth,
        minHeight: 550,
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        alignItems: "stretch",
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>
        <BrandPanel />
      </div>
      <div
        style={{
          flex: 1,
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}