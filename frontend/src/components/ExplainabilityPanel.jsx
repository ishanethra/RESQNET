import React from "react";

export function ExplainabilityPanel({ result }) {
  const explainability =
    result?.explainability || [
      "Visible pixel-intensity changes between the two uploads drive the damage labels.",
    ];

  const recommendations =
    result?.recommendations || ["Upload imagery to generate dynamic response guidance."];

  return (
    <div className="panel explain-panel">
      <div className="section-title">Explainable AI + Resources</div>

      <div className="bullet-card">
        <strong>Why this area is marked as damaged</strong>
        <ul>
          {explainability.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="bullet-card stack-gap">
        <strong>Recommended response assets</strong>
        <ul>
          {recommendations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
