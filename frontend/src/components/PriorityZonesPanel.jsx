import React from "react";

export function PriorityZonesPanel({ result }) {
  return (
    <div className="panel zones-panel" style={{ height: "100%" }}>
      <div className="section-title">Critical Priority Zones</div>

      {result?.priority_zones?.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--panel-border)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--panel-border)" }}>
          {/* Header Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "16px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--panel-border)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Target Area</span>
            <span style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Damage Class</span>
            <span style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Area (px²)</span>
          </div>

          {/* Data Rows */}
          {result.priority_zones.map((zone, idx) => (
            <div className="zone-row" key={`${zone.label}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "16px", padding: "14px 16px", background: "var(--panel-bg)", transition: "background 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: zone.mean_damage_class >= 2.5 ? "var(--accent-rose)" : "var(--accent-amber)" }} />
                <strong style={{ fontSize: "0.85rem" }}>{zone.label}</strong>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", color: "var(--text-main)" }}>
                {zone.mean_damage_class.toFixed(1)} <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>/ 3.0</span>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", textAlign: "right", color: "var(--accent-blue)" }}>
                {zone.area.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--panel-border)", borderRadius: "12px" }}>
          <p style={{ fontSize: "0.85rem" }}>No high-priority clusters detected in the current imagery.</p>
        </div>
      )}
    </div>
  );
}
