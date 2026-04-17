export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#081223"/>
          <stop offset="100%" stop-color="#153153"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#g)"/>
      <g fill="none" stroke="#4fd1c5" stroke-width="2" opacity="0.35">
        <path d="M0 120h512M0 256h512M0 392h512"/>
        <path d="M120 0v512M256 0v512M392 0v512"/>
      </g>
      <text x="50%" y="46%" text-anchor="middle" fill="#f4f7fb" font-size="30" font-family="Segoe UI, sans-serif">
        Waiting for Comparison Images
      </text>
      <text x="50%" y="54%" text-anchor="middle" fill="#90a7c6" font-size="18" font-family="Segoe UI, sans-serif">
        Add before and after views to begin analysis
      </text>
    </svg>
  `);

export const DISASTER_COPY = {
  flood: {
    title: "Flood Damage Overview",
    subtitle: "Compare the same area before and after flooding to reveal water-driven disruption.",
  },
  earthquake: {
    title: "Earthquake Damage Overview",
    subtitle: "Highlight structural change patterns to support rescue-first response planning.",
  },
  wildfire: {
    title: "Wildfire Damage Overview",
    subtitle: "Surface burn change and spread-prone areas for fast field review.",
  },
  tsunami: {
    title: "Tsunami Damage Overview",
    subtitle: "Compare the area before and after the tsunami to reveal coastal inundation.",
  },
  hurricane: {
    title: "Hurricane Damage Overview",
    subtitle: "Compare the area to observe wind damage and flooding disruption.",
  },
};

export const SAMPLE_METRICS = [
  { label: "Method", value: "Difference analysis" },
  { label: "Processing", value: "Aligned 512 x 512" },
  { label: "Output", value: "Damage + confidence" },
];

export const LAYER_OPTIONS = [
  { key: "damage_map", label: "Damage" },
  { key: "confidence_map", label: "Confidence" },
  { key: "priority_map", label: "Priority" },
];

export const DAMAGE_COLORS = {
  0: "#38bdf8", // Visible blue matching theme
  1: "#ffd166",
  2: "#ff9f43",
  3: "#ff6b6b",
};
