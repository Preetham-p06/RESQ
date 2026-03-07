from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import base64
import requests

app = Flask(__name__)

# Pose detection
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# Face detection
face = cv2.CascadeClassifier(
cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

ESP32_IP = "http://192.168.1.50/alert"

prev_frame = None


@app.route("/detect", methods=["POST"])
def detect():

    global prev_frame

    data = request.json["image"]
    img_data = data.split(",")[1]

    image_bytes = base64.b64decode(img_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)

    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    confidence = 0

    # ------------------
    # Motion Detection
    # ------------------

    if prev_frame is not None:

        diff = cv2.absdiff(prev_frame, gray)

        thresh = cv2.threshold(diff, 20, 255, cv2.THRESH_BINARY)[1]

        if np.sum(thresh) > 500000:
            confidence += 1

    prev_frame = gray

    # ------------------
    # Face Detection
    # ------------------

    faces = face.detectMultiScale(gray, 1.3, 5)

    if len(faces) > 0:
        confidence += 2

    # ------------------
    # Pose Detection
    # ------------------

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    results = pose.process(img_rgb)

    if results.pose_landmarks:
        confidence += 3

    # ------------------
    # Final Decision
    # ------------------

    if confidence >= 3:

        print("Possible victim detected")

        try:
            requests.get(ESP32_IP)
        except:
            pass

        return jsonify({"detected": True})

    return jsonify({"detected": False})


app.run(host="0.0.0.0", port=5000)