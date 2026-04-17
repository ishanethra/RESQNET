import React from "react";
import { DAMAGE_COLORS } from "../data/constants.js";

export function StatsPanel({ result }) {
  return (
    <div className="panel summary-panel">
      <div className="section-title">Area Statistics</div>

      {result ? (
        Object.entries(result.stats).map(([key, stat]) => (
          <div className="damage-row" key={key}>
            <div>
              <span className="damage-dot" style={{ background: DAMAGE_COLORS[key] }} />
              <strong>{stat.label}</strong>
            </div>
            <div className="align-right">
              <div>{stat.pixels.toLocaleString()} px</div>
              <p>{stat.percentage}%</p>
            </div>
          </div>
        ))
      ) : (
        <p>Pixel counts and class percentages will appear here after analysis.</p>
      )}
    </div>
  );
}
