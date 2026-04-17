import os
import json
import base64
import io
from dataclasses import dataclass
from typing import Dict, List, Tuple

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from PIL import Image


DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))

CANVAS_SIZE = (512, 512)
LABELS = {
    0: "No Damage",
    1: "Minor",
    2: "Major",
    3: "Destroyed",
}
COLORS = {
    0: (0, 0, 0),
    1: (255, 215, 0),
    2: (255, 140, 0),
    3: (220, 20, 60),
}
DISASTER_PROFILES = {
    "flood": {
        "bins": [22, 48, 92],
        "blur": 7,
        "morph": 9,
        "threshold_floor": 14,
        "intelligence": "Evacuation corridors and low-lying pockets need faster support routing.",
        "priority": "Evacuation zones",
    },
    "earthquake": {
        "bins": [28, 65, 120],
        "blur": 5,
        "morph": 7,
        "threshold_floor": 16,
        "intelligence": "Collapsed structure signatures increase rescue priority around dense change clusters.",
        "priority": "Rescue priority",
    },
    "wildfire": {
        "bins": [18, 40, 80],
        "blur": 9,
        "morph": 11,
        "threshold_floor": 12,
        "intelligence": "Burn-pattern diffusion suggests spread risk around the hottest confidence areas.",
        "priority": "Spread risk zones",
    },
    "tsunami": {
        "bins": [22, 48, 92],
        "blur": 7,
        "morph": 9,
        "threshold_floor": 14,
        "intelligence": "Coastal inundation tracking needed. Immediate deployment of marine rescue assets advised.",
        "priority": "Coastal impact zones",
    },
    "hurricane": {
        "bins": [22, 48, 92],
        "blur": 7,
        "morph": 9,
        "threshold_floor": 14,
        "intelligence": "Wind and water damage combined. Widespread structural and infrastructure checks required.",
        "priority": "High wind & flood zones",
    },
}
RESOURCE_MAP = {
    1: ["Food & Water", "Rapid field inspection"],
    2: ["Shelter", "Road clearance", "Utility stabilization"],
    3: ["Medical & Rescue", "Search teams", "Critical logistics"],
}


@dataclass
class Zone:
    label: str
    bbox: Tuple[int, int, int, int]
    area: int
    mean_class: float


app = Flask(__name__)
CORS(app)


def pil_to_bgr(file_storage) -> np.ndarray:
    image = Image.open(io.BytesIO(file_storage.read())).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def resize_image(image: np.ndarray, size: Tuple[int, int] = CANVAS_SIZE) -> np.ndarray:
    return cv2.resize(image, size, interpolation=cv2.INTER_AREA)


def align_post_to_pre(pre: np.ndarray, post: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
    pre_gray = cv2.cvtColor(pre, cv2.COLOR_BGR2GRAY)
    post_gray = cv2.cvtColor(post, cv2.COLOR_BGR2GRAY)

    orb = cv2.ORB_create(900)
    keypoints_pre, descriptors_pre = orb.detectAndCompute(pre_gray, None)
    keypoints_post, descriptors_post = orb.detectAndCompute(post_gray, None)

    if descriptors_pre is None or descriptors_post is None:
        return post, {"applied": False, "match_count": 0}

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    raw_matches = matcher.knnMatch(descriptors_pre, descriptors_post, k=2)
    good_matches = []
    for pair in raw_matches:
        if len(pair) < 2:
            continue
        first, second = pair
        if first.distance < 0.78 * second.distance:
            good_matches.append(first)

    if len(good_matches) < 12:
        return post, {"applied": False, "match_count": len(good_matches)}

    src_points = np.float32([keypoints_post[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_points = np.float32([keypoints_pre[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    homography, mask = cv2.findHomography(src_points, dst_points, cv2.RANSAC, 5.0)

    if homography is None:
        return post, {"applied": False, "match_count": len(good_matches)}

    aligned = cv2.warpPerspective(post, homography, (pre.shape[1], pre.shape[0]))
    if mask is None:
        return post, {"applied": False, "match_count": len(good_matches), "inlier_ratio": 0.0}

    inlier_ratio = float(mask.sum()) / float(len(good_matches))
    if inlier_ratio < 0.45:
        return post, {"applied": False, "match_count": len(good_matches), "inlier_ratio": round(inlier_ratio, 2)}

    return aligned, {
        "applied": True,
        "match_count": len(good_matches),
        "inlier_ratio": round(inlier_ratio, 2),
    }


def encode_image(image: np.ndarray) -> str:
    success, buffer = cv2.imencode(".png", image)
    if not success:
        raise ValueError("Unable to encode image")
    encoded = base64.b64encode(buffer.tobytes()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def build_damage_classes(gray_diff: np.ndarray, disaster_type: str) -> np.ndarray:
    profile = DISASTER_PROFILES[disaster_type]
    blurred = cv2.GaussianBlur(gray_diff, (profile["blur"], profile["blur"]), 0)
    classes = np.digitize(blurred, bins=profile["bins"]).astype(np.uint8)
    kernel = np.ones((profile["morph"], profile["morph"]), np.uint8)
    active = (classes > 0).astype(np.uint8) * 255
    active = cv2.morphologyEx(active, cv2.MORPH_CLOSE, kernel)
    active = cv2.morphologyEx(active, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    classes = np.where(active > 0, classes, 0).astype(np.uint8)
    return classes


def colorize_damage_map(classes: np.ndarray) -> np.ndarray:
    damage_map = np.zeros((*classes.shape, 3), dtype=np.uint8)
    for level, color in COLORS.items():
        damage_map[classes == level] = color
    return damage_map


def build_confidence_map(gray_diff: np.ndarray) -> np.ndarray:
    normalized = cv2.normalize(gray_diff, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.applyColorMap(normalized, cv2.COLORMAP_TURBO)


def compute_difference_map(pre: np.ndarray, post: np.ndarray, disaster_type: str) -> Tuple[np.ndarray, Dict[str, float]]:
    profile = DISASTER_PROFILES[disaster_type]

    pre_gray = cv2.cvtColor(pre, cv2.COLOR_BGR2GRAY)
    post_gray = cv2.cvtColor(post, cv2.COLOR_BGR2GRAY)
    pre_gray = cv2.GaussianBlur(pre_gray, (5, 5), 0)
    post_gray = cv2.GaussianBlur(post_gray, (5, 5), 0)

    gray_diff = cv2.absdiff(pre_gray, post_gray)
    otsu_threshold, otsu_mask = cv2.threshold(gray_diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    threshold_value = max(profile["threshold_floor"], int(otsu_threshold * 0.85))

    _, threshold_mask = cv2.threshold(gray_diff, threshold_value, 255, cv2.THRESH_BINARY)
    threshold_mask = cv2.bitwise_or(threshold_mask, otsu_mask)
    threshold_mask = cv2.medianBlur(threshold_mask, 5)
    threshold_mask = cv2.morphologyEx(
        threshold_mask,
        cv2.MORPH_OPEN,
        np.ones((3, 3), np.uint8),
    )
    filtered_diff = cv2.bitwise_and(gray_diff, threshold_mask)
    return filtered_diff, {
        "otsu_threshold": float(round(otsu_threshold, 2)),
        "applied_threshold": threshold_value,
    }


def quadrant_label(x: int, y: int, w: int, h: int, frame_size: Tuple[int, int]) -> str:
    center_x = x + (w / 2)
    center_y = y + (h / 2)
    width, height = frame_size
    horizontal = "West" if center_x < width / 3 else "East" if center_x > (2 * width) / 3 else "Central"
    vertical = "North" if center_y < height / 3 else "South" if center_y > (2 * height) / 3 else "Mid"
    return f"{vertical}-{horizontal}"


def detect_priority_zones(classes: np.ndarray) -> Tuple[np.ndarray, List[Zone]]:
    priority_mask = np.where(classes >= 2, 255, 0).astype(np.uint8)
    priority_mask = cv2.dilate(priority_mask, np.ones((9, 9), np.uint8), iterations=1)
    contours, _ = cv2.findContours(priority_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    overlay = np.zeros((*classes.shape, 3), dtype=np.uint8)
    zones: List[Zone] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 1200:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        region = classes[y : y + h, x : x + w]
        non_zero = region[region > 0]
        mean_class = float(non_zero.mean()) if non_zero.size else 0.0
        label = quadrant_label(x, y, w, h, CANVAS_SIZE)
        zones.append(Zone(label=label, bbox=(x, y, w, h), area=int(area), mean_class=mean_class))
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 255, 255), 2)
        cv2.putText(
            overlay,
            label,
            (x, max(18, y - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

    zones.sort(key=lambda zone: zone.area, reverse=True)
    return overlay, zones


def compute_stats(classes: np.ndarray) -> Dict[str, Dict[str, float]]:
    total_pixels = classes.size
    stats = {}
    for level, label in LABELS.items():
        pixel_count = int(np.count_nonzero(classes == level))
        stats[str(level)] = {
            "label": label,
            "pixels": pixel_count,
            "percentage": round((pixel_count / total_pixels) * 100, 2),
        }
    return stats


def summarize_severity(classes: np.ndarray) -> Dict[str, float]:
    weighted_score = float(classes.mean() / 3 * 100)
    destroyed_pct = float(np.count_nonzero(classes == 3) / classes.size * 100)
    major_pct = float(np.count_nonzero(classes == 2) / classes.size * 100)
    return {
        "weighted_score": round(weighted_score, 2),
        "destroyed_pct": round(destroyed_pct, 2),
        "major_pct": round(major_pct, 2),
    }


def urgency_from_score(score: float) -> Dict[str, str]:
    if score >= 60:
        return {"label": "High", "color": "red", "icon": "HIGH"}
    if score >= 30:
        return {"label": "Medium", "color": "orange", "icon": "MED"}
    return {"label": "Low", "color": "green", "icon": "LOW"}


def severity_label(score: float) -> str:
    if score >= 70:
        return "Critical structural disruption"
    if score >= 45:
        return "Severe localized damage"
    if score >= 20:
        return "Moderate operational disruption"
    return "Limited visible damage"


def build_explanation(gray_diff: np.ndarray, classes: np.ndarray, disaster_type: str) -> List[str]:
    changed_pixels = gray_diff[classes > 0]
    avg_change = float(changed_pixels.mean()) if changed_pixels.size else 0.0
    peak_change = int(gray_diff.max())
    profile = DISASTER_PROFILES[disaster_type]
    return [
        "Areas are marked damaged where pixel intensity changed strongly between pre and post images.",
        f"Average change over damaged pixels is {avg_change:.1f}, with peak change reaching {peak_change}.",
        f"{profile['priority']} are emphasized by merging nearby major and destroyed regions into clusters.",
    ]


def detect_detailed_zones(classes: np.ndarray) -> List[Dict]:
    zones = []
    for level in [1, 2, 3]:
        mask = np.where(classes == level, 255, 0).astype(np.uint8)
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=1)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 300:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            zones.append({
                "level": level,
                "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "area": int(area)
            })
    return zones


def build_recommendations(max_level: int, disaster_type: str) -> List[str]:
    profile = DISASTER_PROFILES[disaster_type]
    recs = RESOURCE_MAP.get(max_level, ["Food & Water", "Field verification"])
    recs = recs + [profile["intelligence"]]
    return recs


def analyze_images(pre_image: np.ndarray, post_image: np.ndarray, disaster_type: str) -> Dict:
    pre = resize_image(pre_image)
    post = resize_image(post_image)
    aligned_post, alignment = align_post_to_pre(pre, post)
    comparison_post = aligned_post if alignment["applied"] else post
    gray_diff, diff_meta = compute_difference_map(pre, comparison_post, disaster_type)

    classes = build_damage_classes(gray_diff, disaster_type)
    damage_map = colorize_damage_map(classes)
    confidence_map = build_confidence_map(gray_diff)
    priority_overlay, zones = detect_priority_zones(classes)
    detailed_zones = detect_detailed_zones(classes)
    priority_map = cv2.addWeighted(damage_map, 0.8, priority_overlay, 1.0, 0)
    blend = cv2.addWeighted(post, 0.45, damage_map, 0.55, 0)

    stats = compute_stats(classes)
    severity = summarize_severity(classes)
    urgency = urgency_from_score(severity["weighted_score"])
    most_affected = zones[0].label if zones else "Distributed low-intensity change"
    max_level = int(classes.max())

    return {
        "images": {
            "pre_image": encode_image(pre),
            "post_image": encode_image(post),
            "damage_map": encode_image(damage_map),
            "confidence_map": encode_image(confidence_map),
            "priority_map": encode_image(priority_map),
            "blend_map": encode_image(blend),
        },
        "stats": stats,
        "ai_decision": {
            "most_affected_zone": most_affected,
            "estimated_severity_level": severity_label(severity["weighted_score"]),
            "disaster_brief": DISASTER_PROFILES[disaster_type]["intelligence"],
        },
        "priority_zones": [
            {
                "label": zone.label,
                "bbox": {"x": zone.bbox[0], "y": zone.bbox[1], "width": zone.bbox[2], "height": zone.bbox[3]},
                "area": zone.area,
                "mean_damage_class": round(zone.mean_class, 2),
            }
            for zone in zones[:5]
        ],
        "detailed_zones": detailed_zones,
        "recommendations": build_recommendations(max_level, disaster_type),
        "urgency_score": urgency,
        "explainability": build_explanation(gray_diff, classes, disaster_type),
        "summary_metrics": severity,
        "processing_notes": {
            "alignment_applied": alignment["applied"],
            "feature_matches": alignment["match_count"],
            "alignment_inlier_ratio": alignment.get("inlier_ratio", 0.0),
            "threshold": diff_meta["applied_threshold"],
        },
        "disaster_type": disaster_type,
    }


@app.get("/health")
def health() -> Tuple[Dict[str, str], int]:
    return {"status": "ok"}, 200


@app.post("/analyze")
def analyze():
    if "pre_image" not in request.files or "post_image" not in request.files:
        return jsonify({"error": "Both pre_image and post_image are required"}), 400

    disaster_type = request.form.get("disaster_type", "flood").lower()
    if disaster_type not in DISASTER_PROFILES:
        return jsonify({"error": "Unsupported disaster type"}), 400

    try:
        pre_image = pil_to_bgr(request.files["pre_image"])
        post_image = pil_to_bgr(request.files["post_image"])
        result = analyze_images(pre_image, post_image, disaster_type)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.get("/dataset-pairs")
def get_dataset_pairs():
    pre_dir = os.path.join(DATASET_DIR, "pre-images")
    if not os.path.exists(pre_dir):
        return jsonify({"pairs": []})
        
    pre_files = sorted(os.listdir(pre_dir))
    pairs = []
    
    for f in pre_files:
        if not f.endswith("_pre_disaster.png"):
            continue
        base_name = f.replace("_pre_disaster.png", "")
        
        disaster_type = "flood"
        if "earthquake" in base_name:
            disaster_type = "earthquake"
        elif "wildfire" in base_name:
            disaster_type = "wildfire"
        elif "tsunami" in base_name:
            disaster_type = "tsunami"
        elif "hurricane" in base_name:
            disaster_type = "hurricane"
            
        # Clean name by removing the ID part (e.g. _00000026)
        clean_name = base_name.split("_")[0]
        display_name = clean_name.replace("-", " ").title()
        
        pairs.append({
            "id": base_name,
            "name": display_name,
            "type": disaster_type
        })
    return jsonify({"pairs": pairs})


@app.get("/dataset-image/<folder>/<filename>")
def get_dataset_image(folder, filename):
    if folder not in ["pre-images", "post-images"]:
        return jsonify({"error": "Invalid folder"}), 400
        
    file_path = os.path.join(DATASET_DIR, folder, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "Not found"}), 404
        
    return send_file(file_path, mimetype='image/png')


@app.post("/analyze-dataset")
def analyze_dataset():
    data = request.json
    if not data or "pre_id" not in data or "post_id" not in data:
        return jsonify({"error": "pre_id and post_id are required"}), 400
        
    pre_id = data["pre_id"]
    post_id = data["post_id"]
    disaster_type = data.get("disaster_type", "flood").lower()
    
    if disaster_type not in DISASTER_PROFILES:
        return jsonify({"error": "Unsupported disaster type"}), 400
        
    pre_path = os.path.join(DATASET_DIR, "pre-images", f"{pre_id}_pre_disaster.png")
    post_path = os.path.join(DATASET_DIR, "post-images", f"{post_id}_post_disaster.png")
    
    if not os.path.exists(pre_path) or not os.path.exists(post_path):
        return jsonify({"error": "Selected dataset images not found on disk"}), 404
        
    try:
        pre_image = cv2.imread(pre_path)
        post_image = cv2.imread(post_path)
        
        if pre_image is None or post_image is None:
            return jsonify({"error": "Failed to decode one of the images"}), 500
            
        result = analyze_images(pre_image, post_image, disaster_type)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
