import React from "react";

export function MissionPanel({
  disasterType,
  error,
  isLoading,
  onDisasterTypeChange,
  datasetPairs,
  selectedPreId,
  onPreChange,
  placeholderImage,
  previews,
}) {
  return (
    <aside className="panel controls">
      <h2 className="section-title">Select Dataset</h2>

      <div style={{ pointerEvents: isLoading ? "none" : "auto", opacity: 1 }}>
        <div className="upload-grid">
          <div className="upload-box">
            <strong>Before Image</strong>
            <p>Select a region to analyze.</p>
            <div className="select-wrap" style={{ marginBottom: "16px" }}>
              <select value={selectedPreId} onChange={(event) => onPreChange(event.target.value)}>
                {datasetPairs?.length > 0 ? (
                  datasetPairs.map((pair) => (
                    <option key={`pre-${pair.id}`} value={pair.id}>{pair.name}</option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </div>
            <div className="media-frame">
              <img src={previews.pre || placeholderImage} alt="Before" />
            </div>
          </div>

          <div className="upload-box">
            <strong>After Image</strong>
            <p>Corresponding capture after {disasterType}.</p>
            <div className="media-frame">
              <img src={previews.post || placeholderImage} alt="After" />
            </div>
          </div>
        </div>

      </div>

      {error ? <div className="error">{error}</div> : null}
    </aside>
  );
}
