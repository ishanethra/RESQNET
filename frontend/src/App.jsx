import React, { useEffect, useMemo, useState } from "react";
import {
  API_BASE,
  DISASTER_COPY,
  LAYER_OPTIONS,
  PLACEHOLDER_IMAGE,
  SAMPLE_METRICS,
} from "./data/constants.js";
import { HeroSection } from "./components/HeroSection.jsx";
import { MissionPanel } from "./components/MissionPanel.jsx";
import { VisualPanel } from "./components/VisualPanel.jsx";
import { DecisionPanel } from "./components/DecisionPanel.jsx";
import { StatsPanel } from "./components/StatsPanel.jsx";
import { PriorityZonesPanel } from "./components/PriorityZonesPanel.jsx";
import { LandingPage } from "./components/LandingPage.jsx";

export default function App() {
  const [disasterType, setDisasterType] = useState("flood");
  const [datasetPairs, setDatasetPairs] = useState([]);
  const [selectedPreId, setSelectedPreId] = useState("");
  const [previews, setPreviews] = useState({ pre: "", post: "" });
  const [result, setResult] = useState(null);
  const [activeLayer, setActiveLayer] = useState("confidence_map");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasEntered, setHasEntered] = useState(false);

  const copy = DISASTER_COPY[disasterType] || DISASTER_COPY["flood"];
  const visibleImage = result?.images?.[activeLayer] ?? "";
  const severityScore = result?.summary_metrics?.weighted_score ?? 0;

  // Derive the selected pair's name for dynamic labeling
  const selectedPairName = useMemo(() => {
    const pair = datasetPairs.find((p) => p.id === selectedPreId);
    return pair ? pair.name : "Satellite Imagery Analysis";
  }, [selectedPreId, datasetPairs]);

  // Set Global Dark Theme Attribute once
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Dataset pairs fetching
  useEffect(() => {
    fetch(`${API_BASE}/dataset-pairs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pairs && data.pairs.length > 0) {
          setDatasetPairs(data.pairs);
          setSelectedPreId(data.pairs[0].id);
          setDisasterType(data.pairs[0].type);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to the backend server. Make sure it is running.");
      });
  }, []);

  // Analysis trigger on selection
  useEffect(() => {
    if (!selectedPreId || datasetPairs.length === 0) return;

    setPreviews({
      pre: `${API_BASE}/dataset-image/pre-images/${selectedPreId}_pre_disaster.png`,
      post: `${API_BASE}/dataset-image/post-images/${selectedPreId}_post_disaster.png`,
    });

    // Reset to Confidence view on change
    setActiveLayer("confidence_map");

    let type = disasterType;
    const pair = datasetPairs.find((p) => p.id === selectedPreId);
    if (pair) {
      setDisasterType(pair.type);
      type = pair.type;
    }

    executeAnalysis(selectedPreId, selectedPreId, type);
  }, [selectedPreId, datasetPairs]);

  const topStats = useMemo(() => {
    if (!result) return SAMPLE_METRICS;
    return [
      { label: "Severity Score", value: `${severityScore.toFixed(1)} / 100` },
      { label: "Most Affected", value: result.ai_decision.most_affected_zone },
      { label: "Priority Zones", value: String(result.priority_zones.length || 0) },
    ];
  }, [result, severityScore]);

  async function executeAnalysis(preId, postId, typeVal) {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/analyze-dataset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pre_id: preId, post_id: postId, disaster_type: typeVal }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analysis failed");

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }

  return (
    <div className="app-container">
      <aside className="app-sidebar">
        <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="brand-name">RESQNET</h1>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPairName)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Get direction to ${selectedPairName}`}
            className="map-link-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </a>
        </div>

        <MissionPanel
          disasterType={disasterType}
          error={error}
          isLoading={isLoading}
          onDisasterTypeChange={(val) => {
            setDisasterType(val);
            executeAnalysis(selectedPreId, selectedPreId, val);
          }}
          datasetPairs={datasetPairs}
          selectedPreId={selectedPreId}
          onPreChange={setSelectedPreId}
          placeholderImage={PLACEHOLDER_IMAGE}
          previews={previews}
        />
      </aside>

      <main className="main-canvas">
        <HeroSection
          copy={copy}
          topStats={topStats}
          pairName={selectedPairName}
          disasterType={disasterType}
        />

        <VisualPanel
          activeLayer={activeLayer}
          isLoading={isLoading}
          layerOptions={LAYER_OPTIONS}
          onLayerChange={setActiveLayer}
          previews={previews}
          placeholderImage={PLACEHOLDER_IMAGE}
          result={result}
          visibleImage={visibleImage}
        />

        <section className="stats-grid section-gap">
          <DecisionPanel copy={copy} result={result} />
          <StatsPanel result={result} />
        </section>

        <section className="bottom-grid section-gap" style={{ gridTemplateColumns: "1fr" }}>
          <PriorityZonesPanel result={result} />
        </section>
      </main>
    </div>
  );
}
