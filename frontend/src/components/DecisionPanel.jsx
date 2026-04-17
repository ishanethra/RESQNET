import React from "react";

export function DecisionPanel({ copy, result }) {
  return (
    <div className="panel summary-panel">
      <div className="section-title" style={{ marginBottom: "16px" }}>AI Decision Panel</div>

      <div className="decision-grid">
        <div className="decision-card">
          <div className="decision-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <strong>Affected Zone</strong>
          </div>
          <p className="decision-value" style={{ color: "var(--text-main)" }}>
            {result?.ai_decision?.most_affected_zone || "Waiting..."}
          </p>
        </div>

        <div className="decision-card">
          <div className="decision-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <strong>Severity Level</strong>
          </div>
          <p className="decision-value">
            {result?.ai_decision?.estimated_severity_level || "Pending analysis"}
          </p>
        </div>

        <div className="decision-card full-width">
          <div className="decision-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <strong>Disaster-Aware Intelligence</strong>
          </div>
          <p className="decision-value" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
            {result?.ai_decision?.disaster_brief || copy.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
