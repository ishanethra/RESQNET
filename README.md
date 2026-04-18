🌍🛰️ RESQNET

RESQNET is an AI-powered platform that analyzes satellite imagery to detect and classify structural damage after natural disasters.

By comparing pre-disaster and post-disaster images, it helps responders quickly understand what changed, where, and how severe it is—turning raw data into actionable insights.

🚀 Live Demo

🔗 Try it here: https://resqnet-zbtu.onrender.com

⚠️ Note: Make sure the latest changes are pushed to GitHub for the deployment (Vercel) to reflect the updated global dataset.

🧠 How It Works

At its core, RESQNET does three things:

Aligns satellite images taken at different times (even if angles differ) Detects changes at the pixel level Highlights damage zones and assigns severity scores

This allows emergency teams to prioritize response efforts faster and more accurately.

🛠️ Tech Stack 🎨 Frontend (User Dashboard) React 18 – Handles dynamic UI and complex state (image overlays, toggles) Vite – Fast development and optimized builds Vanilla CSS – Clean dark-mode UI with glassmorphism styling Interactive Layers – Toggle between: Damage Maps Confidence Gradients Priority Zones ⚙️ Backend (AI Engine) Flask (Python) – Lightweight API for image analysis OpenCV – Core computer vision engine: ORB Feature Matching → fixes image misalignment Difference Mapping → detects structural changes Contour Detection → identifies affected zones NumPy & Pillow – Efficient image processing and transformations 🌐 Dataset Strategy (Important)

Instead of bundling large datasets into the app (which breaks deployments), DisasterLens uses a smart global dataset approach:

📦 Images are hosted on a public GitHub RAW repository ⚡ Backend fetches only what’s needed on-demand 🚀 Keeps deployment lightweight, fast, and scalable 🌟 Key Features

✅ Multi-Disaster Support Floods, Earthquakes, Wildfires, Tsunamis, Hurricanes

✅ Automatic Image Alignment Corrects satellite drift using ORB feature matching

✅ Severity Scoring (0–100) Quantifies damage based on affected area

✅ Priority Zone Detection Identifies critical regions (e.g., North-West quadrant)

📂 Project Structure ├── api/ # Flask backend (Vercel serverless functions) ├── frontend/ # React + Vite app ├── dataset/ # Optional local dataset ├── vercel.json # Deployment configuration └── requirements.txt # Python dependencies 💻 Local Setup 1️⃣ Clone the Repository git clone https://github.com/danielsolomon007/Disasterlens.git 2️⃣ Run Frontend cd frontend npm install npm run dev 3️⃣ Run Backend pip install -r requirements.txt python api/index.py 🎯 Why This Project Matters

Disaster response is often delayed due to lack of clear, real-time insights. DisasterLens addresses this by:

Reducing manual analysis time Providing data-driven decision support Helping teams prioritize high-impact areas faster 🏆 Recognition

Built as a high-impact AI solution for disaster management, focused on real-world usability and humanitarian impact.
