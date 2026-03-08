# RESQ

## Overview

RESQ is a disaster-response system designed to help locate victims and coordinate rescuers during earthquakes and other emergency situations. When traditional communication infrastructure such as cellular networks and internet services fails, RESQ enables local communication using Bluetooth Low Energy (BLE) while providing AI-assisted victim detection, cloud storage, and map-based rescue coordination.

The system integrates AI models, mapping services, cloud storage, and hardware communication to create a decentralized emergency response network.

## Problem

During major earthquakes and structural collapses, communication infrastructure such as cell towers and internet connectivity often becomes unavailable. Victims trapped under debris are unable to signal for help, and rescue teams struggle to locate people quickly across large disaster areas.

Many existing emergency systems depend on centralized infrastructure. When these systems fail, rescue coordination slows significantly and valuable time is lost.

## Solution

RESQ provides a platform where victims can broadcast distress signals containing their location, urgency level, number of people detected, and captured camera images. Rescue teams can view these signals on a live map and navigate directly to the affected location.

The system focuses on:

* Distress signal broadcasting
* AI-based human detection
* Map-based rescue coordination
* Local communication using BLE
* Cloud storage for distress data

## Hardware Integration

RESQ connects software with physical communication hardware through Bluetooth Low Energy (BLE). Devices can act as signal relays, allowing distress signals to travel between nearby devices even when internet connectivity is unavailable.

This allows a local communication network between smartphones and BLE-enabled rescue hardware.

## AI Detection

The system uses TensorFlow.js with the COCO-SSD object detection model to identify people in images captured by the device camera. When a distress signal is sent, the AI model analyzes the image and estimates how many individuals may be present.

This information helps rescuers prioritize locations where multiple victims may be trapped.

## Chatbot Assistance

RESQ also includes an AI-powered chatbot designed to assist users with guidance during emergency situations. The chatbot is powered by the Gemini API and can help answer questions related to emergency procedures, safety instructions, and system usage.

## System Workflow

1. A victim activates distress mode.
2. The device captures an image using the camera.
3. TensorFlow.js runs the COCO-SSD model to detect people.
4. The system records the GPS coordinates of the device.
5. A distress signal is created containing:

   * location
   * urgency level
   * detected number of people
   * captured image
6. Images and signal data can be uploaded to cloud storage.
7. The signal is transmitted using BLE communication.
8. Rescue teams view signals on a map and navigate to the location.

## Technology Stack

Frontend

* HTML
* CSS
* JavaScript

Backend

* Node.js
* Express

Artificial Intelligence

* TensorFlow.js
* COCO-SSD object detection model

Mapping and Navigation

* Google Maps JavaScript API
* Google Maps Directions API

Cloud Storage

* Dropbox API

AI Assistant

* Gemini API

Hardware Communication

* Web Bluetooth API
* Bluetooth Low Energy (BLE)

## APIs Used

* Google Maps JavaScript API
* Google Maps Directions API
* Web Bluetooth API
* Dropbox API
* Gemini API
* TensorFlow.js CDN
* COCO-SSD Model CDN

External libraries loaded through CDN:

* https://cdn.jsdelivr.net/npm/@tensorflow/tfjs
* https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd

## Features

* Real-time map displaying distress signals
* AI-based human detection using camera input
* Image capture and analysis for rescue verification
* BLE-based device communication
* Navigation to victim locations using Google Maps
* Distress signal broadcasting with location and urgency level
* Cloud storage for captured images using Dropbox
* AI-powered chatbot using Gemini

## Authors

Preetham
Aadit Krish
Jaideep
