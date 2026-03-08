from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import base64
import requests
import time

app = Flask(__name__)

# -------------------------
# MediaPipe Setup
# -------------------------

mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_detection

pose = mp_pose.Pose(
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

face = mp_face.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.6
)

# -------------------------
# ESP32 CONFIG
# -------------------------

ESP32_IP = "http://192.168.1.50/alert"

# -------------------------
# GLOBAL VARIABLES
# -------------------------

prev_frame = None
last_alert_time = 0

ALERT_COOLDOWN = 5

frame_buffer = []
BUFFER_SIZE = 5


# -------------------------
# DETECTION ROUTE
# -------------------------

@app.route("/detect", methods=["POST"])
def detect():

    global prev_frame
    global last_alert_time
    global frame_buffer

    data = request.json["image"]

    img_data = data.split(",")[1]
    image_bytes = base64.b64decode(img_data)

    np_arr = np.frombuffer(image_bytes, np.uint8)

    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    height, width = img.shape[:2]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    confidence = 0
    boxes = []
    people_count = 0

    # -------------------------
    # Motion Detection
    # -------------------------

    if prev_frame is not None:

        diff = cv2.absdiff(prev_frame, gray)

        blur = cv2.GaussianBlur(diff, (5,5), 0)

        thresh = cv2.threshold(blur, 25, 255, cv2.THRESH_BINARY)[1]

        motion_pixels = np.sum(thresh)

        if motion_pixels > 800000:
            confidence += 1

    prev_frame = gray

    # -------------------------
    # Face Detection
    # -------------------------

    face_results = face.process(img_rgb)

    if face_results.detections:

        for detection in face_results.detections:

            bbox = detection.location_data.relative_bounding_box

            x = int(bbox.xmin * width)
            y = int(bbox.ymin * height)
            w = int(bbox.width * width)
            h = int(bbox.height * height)

            boxes.append({
                "x": x,
                "y": y,
                "w": w,
                "h": h
            })

        people_count += len(face_results.detections)
        confidence += 2

    # -------------------------
    # Pose Detection
    # -------------------------

    pose_results = pose.process(img_rgb)

    if pose_results.pose_landmarks:

        confidence += 3
        people_count += 1

        xs = []
        ys = []

        for lm in pose_results.pose_landmarks.landmark:

            xs.append(int(lm.x * width))
            ys.append(int(lm.y * height))

        x1 = min(xs)
        y1 = min(ys)
        x2 = max(xs)
        y2 = max(ys)

        boxes.append({
            "x": x1,
            "y": y1,
            "w": x2 - x1,
            "h": y2 - y1
        })

    # -------------------------
    # Detection Smoothing
    # -------------------------

    frame_buffer.append(confidence)

    if len(frame_buffer) > BUFFER_SIZE:
        frame_buffer.pop(0)

    avg_confidence = sum(frame_buffer) / len(frame_buffer)

    detected = avg_confidence >= 2.5

    # -------------------------
    # ESP32 ALERT
    # -------------------------

    if detected and (time.time() - last_alert_time > ALERT_COOLDOWN):

        print("Victim detected:", people_count)

        try:

            # send count to ESP32
            requests.get(f"{ESP32_IP}?count={people_count}")

        except Exception as e:

            print("ESP32 connection failed:", e)

        last_alert_time = time.time()

    # -------------------------
    # RESPONSE
    # -------------------------

    return jsonify({
        "detected": detected,
        "count": people_count,
        "boxes": boxes
    })


# -------------------------
# START SERVER
# -------------------------

if __name__ == "__main__":

    print("AI Detection Server Running")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )