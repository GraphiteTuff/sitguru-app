// emails/FinalPawReportEmail.tsx
/**
 * Responsive final PawReport summary email (Resend `react:` payload).
 * Inline styles for mobile email clients.
 */

import * as React from "react";

export type FinalPawReportEmailProps = {
  petName: string;
  guruName: string;
  distanceMiles: number;
  durationMinutes: number;
  pottyLogs: Array<{ label: string; at: string }>;
  photoUrls: string[];
  liveUrl: string;
  endedAt: string;
};

export function FinalPawReportEmail({
  petName,
  guruName,
  distanceMiles,
  durationMinutes,
  pottyLogs,
  photoUrls,
  liveUrl,
  endedAt,
}: FinalPawReportEmailProps) {
  const shell: React.CSSProperties = {
    margin: 0,
    padding: "24px 12px",
    background: "#f0fdf8",
    fontFamily:
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
    color: "#0f172a",
  };

  const card: React.CSSProperties = {
    maxWidth: 560,
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: 24,
    border: "1px solid #d1fae5",
    overflow: "hidden",
  };

  const metricBox: React.CSSProperties = {
    flex: 1,
    minWidth: 120,
    background: "#ecfdf5",
    borderRadius: 16,
    padding: "14px 16px",
    textAlign: "center" as const,
  };

  return (
    <div style={shell}>
      <div style={card}>
        <div
          style={{
            background: "linear-gradient(135deg,#064e3b,#059669)",
            padding: "28px 24px",
            color: "#ffffff",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            SitGuru PawReport
          </p>
          <h1
            style={{
              margin: "10px 0 0",
              fontSize: 28,
              lineHeight: 1.15,
              fontWeight: 900,
            }}
          >
            {petName} is home safe!
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, opacity: 0.92 }}>
            Walk completed {endedAt} · Care by {guruName}
          </p>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={metricBox}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#047857",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Distance
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {distanceMiles.toFixed(1)} mi
              </p>
            </div>
            <div style={metricBox}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#047857",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Duration
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {Math.round(durationMinutes)} min
              </p>
            </div>
          </div>

          <h2
            style={{
              margin: "28px 0 12px",
              fontSize: 16,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            Potty logs
          </h2>
          {pottyLogs.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
              No potty events were logged on this walk.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {pottyLogs.map((log, index) => (
                <li
                  key={`${log.label}-${index}`}
                  style={{
                    marginBottom: 8,
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {log.label} · {log.at}
                </li>
              ))}
            </ul>
          )}

          {photoUrls.length > 0 ? (
            <>
              <h2
                style={{
                  margin: "28px 0 12px",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                Visit photos
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {photoUrls.slice(0, 6).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`${petName} visit photo`}
                    width={160}
                    height={120}
                    style={{
                      width: 160,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}

          <div style={{ marginTop: 28, textAlign: "center" }}>
            <a
              href={liveUrl}
              style={{
                display: "inline-block",
                background: "#047857",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 14,
                padding: "14px 22px",
                borderRadius: 999,
              }}
            >
              View full PawReport
            </a>
          </div>
        </div>

        <div
          style={{
            padding: "16px 24px 24px",
            fontSize: 12,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          SitGuru · Trusted pet care, simplified.
        </div>
      </div>
    </div>
  );
}

export default FinalPawReportEmail;
