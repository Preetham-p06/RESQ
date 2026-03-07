let map;
let currentMode = "victim";

let directionsService;
let directionsRenderer;

let capturedImage = null;
let distressMarkers = [];
let stream;

let btDevice;
let btCharacteristic;

/* -------------------------
BLUETOOTH CONNECT
------------------------- */

async function connectBluetooth(){

try{

btDevice = await navigator.bluetooth.requestDevice({
acceptAllDevices: true,
optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"]
});

const server = await btDevice.gatt.connect();

const service = await server.getPrimaryService(
"0000ffe0-0000-1000-8000-00805f9b34fb"
);

btCharacteristic = await service.getCharacteristic(
"0000ffe1-0000-1000-8000-00805f9b34fb"
);

alert("ESP32 Connected");

}catch(err){

console.log("Bluetooth connection failed:",err);
alert("Bluetooth connection failed");

}

}

/* -------------------------
AI DETECTION
------------------------- */

let model = null;
let detecting = false;

async function loadAI(){

if(!model){
model = await cocoSsd.load();
console.log("AI model loaded");
}

}

async function detectVictims(){

const video = document.getElementById("camera");
const canvas = document.getElementById("aiCanvas");
const ctx = canvas.getContext("2d");

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

detecting = true;

while(detecting){

const predictions = await model.detect(video);

ctx.clearRect(0,0,canvas.width,canvas.height);

predictions.forEach(p=>{

if(p.class === "person"){

const [x,y,w,h] = p.bbox;

ctx.strokeStyle = "red";
ctx.lineWidth = 3;
ctx.strokeRect(x,y,w,h);

ctx.fillStyle="red";
ctx.font="16px Arial";
ctx.fillText("Victim Detected",x,y-5);

}

});

await new Promise(r=>setTimeout(r,120));

}

}

/* -------------------------
INIT UI
------------------------- */

window.onload = () => {

const connectBtn = document.getElementById("connectESP");
if(connectBtn) connectBtn.onclick = connectBluetooth;

const victimBtn = document.getElementById("victimMode");
const rescuerBtn = document.getElementById("rescuerMode");

const chatBtn = document.getElementById("chatBtn");
const chatPanel = document.getElementById("chatPanel");

const distressBtn = document.getElementById("alertButton");
const distressForm = document.getElementById("distressForm");

const sendMessageBtn = document.getElementById("sendMessage");
const userInput = document.getElementById("userInput");

const photoBtn = document.getElementById("photoBtn");
const cameraPanel = document.getElementById("cameraPanel");
const video = document.getElementById("camera");
const captureBtn = document.getElementById("captureBtn");

const buzzerBtn = document.getElementById("buzzerBtn");

const rescueBtn = document.getElementById("rescueBtn");
const rescuePopup = document.getElementById("rescuePopup");

/* -------------------------
RESCUE POPUP
------------------------- */

if(rescueBtn){

rescueBtn.onclick = () => {

rescuePopup.style.display =
rescuePopup.style.display === "block" ? "none" : "block";

}

}

/* -------------------------
MODE SWITCH
------------------------- */

if(victimBtn){

victimBtn.onclick = () => {

currentMode = "victim";

if(rescueBtn) rescueBtn.style.display = "none";
if(rescuePopup) rescuePopup.style.display = "none";

if(distressBtn) distressBtn.style.display = "block";

const controls = document.querySelector(".controls");
if(controls) controls.style.display = "flex";

}

}

if(rescuerBtn){

rescuerBtn.onclick = () => {

currentMode = "rescuer";

if(rescueBtn) rescueBtn.style.display = "block";

if(distressBtn) distressBtn.style.display = "none";

/* keep controls visible so camera works */

const controls = document.querySelector(".controls");
if(controls) controls.style.display = "flex";

loadDistressSignals();

}

}

/* -------------------------
CHAT
------------------------- */

function addUserMessage(text){

const chatbox = document.getElementById("chatbox");

const msg = document.createElement("div");
msg.className="userMsg";
msg.innerText=text;

chatbox.appendChild(msg);
chatbox.scrollTop = chatbox.scrollHeight;

}

function addBotMessage(text){

const chatbox = document.getElementById("chatbox");

const msg = document.createElement("div");
msg.className="botMsg";
msg.innerText=text;

chatbox.appendChild(msg);
chatbox.scrollTop = chatbox.scrollHeight;

}

if(sendMessageBtn){

sendMessageBtn.onclick = async ()=>{

const message = userInput.value.trim();
if(message==="") return;

addUserMessage(message);
userInput.value="";

try{

const response = await fetch("http://localhost:3000/chat",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({message})
});

const data = await response.json();

addBotMessage(data.reply || "AI error");

}catch{

addBotMessage("Unable to connect to rescue assistant");

}

}

}

/* -------------------------
CAMERA
------------------------- */

if(photoBtn){

photoBtn.onclick = async ()=>{

cameraPanel.style.display="flex";

try{

stream = await navigator.mediaDevices.getUserMedia({video:true});
video.srcObject=stream;

await loadAI();
detectVictims();

}catch{

alert("Camera access failed");

}

}

}

if(captureBtn){

captureBtn.onclick=()=>{

detecting=false;

const canvas = document.getElementById("snapshot");
const ctx = canvas.getContext("2d");

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

ctx.drawImage(video,0,0);

capturedImage = canvas.toDataURL("image/png");

stream.getTracks().forEach(t=>t.stop());

cameraPanel.style.display="none";

alert("Photo attached to distress signal");

}

}

/* -------------------------
DISTRESS
------------------------- */

if(distressBtn){

distressBtn.onclick=()=>{

distressForm.style.display =
distressForm.style.display==="block" ? "none":"block";

}

}

const submitDistress=document.getElementById("submitDistress");

if(submitDistress){

submitDistress.onclick=()=>{

const name=document.getElementById("victimName").value;
const urgency=document.getElementById("urgencyLevel").value;
const people=document.getElementById("peopleNearby").value;

if(name===""||people===""){

alert("Please fill all fields");
return;

}

navigator.geolocation.getCurrentPosition(async pos=>{

const data={
name,
urgency,
people,
lat:pos.coords.latitude,
lng:pos.coords.longitude,
image:capturedImage
};

await fetch("http://localhost:3000/distress",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
});

/* trigger ESP32 buzzer */

if(btCharacteristic){

const encoder = new TextEncoder();

await btCharacteristic.writeValue(
encoder.encode("BUZZ")
);

}

alert("Distress signal sent");

distressForm.style.display="none";

});

}

}

/* -------------------------
MANUAL BUZZER
------------------------- */

if(buzzerBtn){

buzzerBtn.onclick=async()=>{

if(btCharacteristic){

const encoder = new TextEncoder();

await btCharacteristic.writeValue(
encoder.encode("BUZZ")
);

alert("Buzzer activated");

}else{

alert("Bluetooth not connected");

}

}

}

};

/* -------------------------
MAP INIT
------------------------- */

function initMap(){

navigator.geolocation.getCurrentPosition(pos=>{

const location={lat:pos.coords.latitude,lng:pos.coords.longitude};

map=new google.maps.Map(document.getElementById("map"),{
zoom:14,
center:location
});

directionsService=new google.maps.DirectionsService();
directionsRenderer=new google.maps.DirectionsRenderer();

directionsRenderer.setMap(map);

new google.maps.Marker({
position:location,
map:map,
title:"Your Location"
});

});

}

/* -------------------------
NAVIGATION
------------------------- */

function navigateToVictim(victimLat,victimLng){

navigator.geolocation.getCurrentPosition(pos=>{

const request={
origin:{lat:pos.coords.latitude,lng:pos.coords.longitude},
destination:{lat:victimLat,lng:victimLng},
travelMode:"DRIVING"
};

directionsService.route(request,(result,status)=>{
if(status==="OK"){
directionsRenderer.setDirections(result);
}
});

});

}

/* -------------------------
LOAD DISTRESS SIGNALS
------------------------- */

async function loadDistressSignals(){

const res = await fetch("http://localhost:3000/distress");
const signals = await res.json();

const list = document.getElementById("requestsList");
list.innerHTML="";

distressMarkers.forEach(m=>m.setMap(null));
distressMarkers=[];

signals.forEach(signal=>{

const marker=new google.maps.Marker({
position:{lat:signal.lat,lng:signal.lng},
map:map
});

distressMarkers.push(marker);

const card=document.createElement("div");
card.className="requestCard";

card.innerHTML=`
<b>${signal.name}</b><br>
Urgency: ${signal.urgency}<br>
People: ${signal.people}<br><br>
${signal.image ? `<img src="${signal.image}" style="width:100%;border-radius:8px;">` : ""}
`;

card.onclick=()=>{

map.setCenter({lat:signal.lat,lng:signal.lng});
map.setZoom(17);

navigateToVictim(signal.lat,signal.lng);

};

list.appendChild(card);

});

}