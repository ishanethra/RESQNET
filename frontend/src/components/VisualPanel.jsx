import React, { useState } from "react";

function ImageModal({ imageSrc, zones, onClose }) {
  const getBBoxColor = (level) => {
    if (level === 1) return "brown";
    if (level === 2) return "yellow";
    if (level === 3) return "red";
    return "white";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-image-wrapper">
          <img src={imageSrc} alt="Enlarged layer" />
          {zones.map((z, i) => {
            const left = (z.bbox.x / 512) * 100 + "%";
            const top = (z.bbox.y / 512) * 100 + "%";
            const width = (z.bbox.width / 512) * 100 + "%";
            const height = (z.bbox.height / 512) * 100 + "%";
            return (
              <div key={i} className="bbox-overlay" style={{
                borderColor: getBBoxColor(z.level),
                left, top, width, height
              }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LayerToggle({ activeLayer, layerOptions, onLayerChange }) {
  return (
    <div className="toggle-row" style={{ marginBottom: "16px" }}>
      {layerOptions.map((layer) => (
        <button
          type="button"
          key={layer.key}
          className={`toggle-pill ${activeLayer === layer.key ? "active" : ""}`}
          onClick={() => onLayerChange(layer.key)}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="loading" style={{ gridColumn: "1 / -1", padding: "60px 0" }}>
      <div className="spinner" />
      <strong>Analyzing images...</strong>
      <p className="loading-copy" style={{ marginTop: "8px" }}>
        Comparing before and after views to detect damage.
      </p>
    </div>
  );
}

function VisualCard({ title, image, alt }) {
  return (
    <div className="visual-card">
      <strong>{title}</strong>
      <div className="media-frame">
        <img src={image} alt={alt} />
      </div>
    </div>
  );
}

export function VisualPanel({
  activeLayer,
  isLoading,
  layerOptions,
  onLayerChange,
  previews,
  placeholderImage,
  result,
  visibleImage,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const detailedZones = result?.detailed_zones || [];

  const preImage = result?.images?.pre_image || previews.pre || placeholderImage;
  const postImage = result?.images?.post_image || previews.post || placeholderImage;
  const damageImage = result?.images?.damage_map || previews.post || placeholderImage;
  const selectedImage = visibleImage || previews.post || placeholderImage;

  return (
    <main className="panel visual-panel">
      <div className="summary-head" style={{ marginBottom: "12px" }}>
        <div>
          <div className="section-title" style={{ marginBottom: "4px" }}>Analysis Results</div>
          <p>Switch between layers to view different results.</p>
        </div>

        {result ? (
          <div className={`urgency ${result.urgency_score.color}`}>
            Urgency: {result.urgency_score.label}
          </div>
        ) : null}
      </div>

      <LayerToggle
        activeLayer={activeLayer}
        layerOptions={layerOptions}
        onLayerChange={onLayerChange}
      />

      {isLoading ? (
        <LoadingCard />
      ) : (
        <div className="visual-grid">
          <VisualCard title="Before" image={preImage} alt="Pre disaster" />
          <VisualCard title="After" image={postImage} alt="Post disaster" />
          <div onClick={() => setModalOpen(true)} style={{ cursor: "zoom-in" }} title="Click to enlarge">
            <VisualCard title="Current Layer" image={selectedImage} alt="Analysis layer" />
          </div>

          <div className="transition-frame" style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Process Flow</strong>
            </div>
            <div className="transition-strip">
              <img src={preImage} alt="Before transition frame" />
              <img src={postImage} alt="After transition frame" />
              <img src={damageImage} alt="Damage transition frame" />
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ImageModal
          imageSrc={selectedImage}
          zones={detailedZones}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}
