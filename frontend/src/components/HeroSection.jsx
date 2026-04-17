import React from "react";

export function HeroSection({ copy, topStats, pairName, disasterType }) {
  const capitalizedDisaster = disasterType.charAt(0).toUpperCase() + disasterType.slice(1);
  
  return (
    <section className="hero">
      <div className="panel hero-main">
        <div className="eyebrow">
          {capitalizedDisaster} Assessment
        </div>
        <h1 style={{ color: "white" }}>{pairName}</h1>
        <p style={{ maxWidth: "45ch" }}>
          {copy.subtitle} Compare images to see damage patterns and assessment results.
        </p>

        <div className="hero-grid">
          {topStats.map((item) => (
            <div className="micro-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
