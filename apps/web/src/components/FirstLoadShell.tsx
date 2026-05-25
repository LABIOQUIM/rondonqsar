import type { CSSProperties } from "react";

const splashStyle: CSSProperties = {
  alignItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(21, 170, 191, 0.18), transparent 30%), linear-gradient(180deg, #f8fcfc 0%, #ffffff 58%, #f0fbfc 100%)",
  color: "#082c33",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  inset: 0,
  justifyContent: "center",
  minHeight: "100dvh",
  padding: "24px",
  position: "fixed",
  textAlign: "center",
  zIndex: 2147483647,
};

const brandStyle: CSSProperties = {
  fontFamily: "Lexend, Inter, system-ui, sans-serif",
  fontSize: "clamp(2.35rem, 7vw, 4rem)",
  fontWeight: 800,
  lineHeight: 1,
};

const messageStyle: CSSProperties = {
  color: "#0d555f",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "1rem",
  fontWeight: 700,
  letterSpacing: "0.02em",
};

const barsStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "8px",
  height: "24px",
  justifyContent: "center",
};

const barStyle: CSSProperties = {
  animation: "rondonqsar-first-load-pulse 0.8s ease-in-out infinite alternate",
  backgroundColor: "#15aabf",
  borderRadius: "999px",
  display: "block",
  height: "20px",
  width: "8px",
};

export function FirstLoadShell() {
  return (
    <>
      <div aria-hidden style={splashStyle}>
        <style>
          {`@keyframes rondonqsar-first-load-pulse{from{opacity:.35;transform:scaleY(.45)}to{opacity:1;transform:scaleY(1)}}`}
        </style>
        <div style={brandStyle}>RondonQSAR</div>
        <div style={messageStyle}>Preparing workspace...</div>
        <div style={barsStyle}>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              style={{
                ...barStyle,
                animationDelay: `${index * 0.14}s`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
