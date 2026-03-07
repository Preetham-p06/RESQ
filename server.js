const express = require("express")
const cors = require("cors")
const fetch = require("node-fetch")
const { Dropbox } = require("dropbox")

const app = express()

app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

/* ---------------------------
API KEYS
---------------------------- */

const GEMINI_KEY = "AIzaSyBBujRMKylL2OOYuYJZC4EQhomoDf6zx6U"

const DROPBOX_TOKEN = "sl.u.AGVJIPZFQdO0G7zodiGEH_ERQ_Q6t7oAiWkIk_CpApSPZmiNlP-3Wb_xtJ38yMGNhgHpqjkJVEocb6_HTh2QjxsiVJayyC2GrFpAJd9sJEw8BPoQFc7XfIJ05OcU0xM4aIZJtCEu2dlb7YbE7ascqGTc9zNuBCwLBCePknCbUW6Gco11l15Jzs61_5zIeOs4T661xaaygAFCuiIGYtpPBJ4wpHPebqF8MpfZz1RqW5-uaGUrb5dpdAYVIeW7JZM8LyB10ggLIFR_Eh6H87kSHijbCjNPVJiDd967Ia8yvH0hwffTbatdzCVwzr4JtBjIud0eRiZ7o9zdFDLXcoUu6kaSouHHJLpcHC1ZkeMoRTeF_9VVmp3PNqcW-MUPyserFUHMv5BQRcnUBnPJ0H43lN7lBbqcUT0oscEJ-NpW_Tkfyql9b1TNCYHwR7mNxvSsEj90AlQnfbBiWxsjJdxlc4cKnYhizZUXDNsIovqQDORZ2SPPTeFtBR5mue61JjxAcBhvOz5sV_19hA0SHtKvOC3JDi5HYfUBX-ist-gooTcsodRW9mhDbCXVm14WKqakRPRoFBvurUraNAJ2N7wC4aj5wEluWM60E8cGtjV3-X7ozyf0mlJ90SeJfeqQeDvL3IGi60AnbPbZsTQmshJ_CZTvllabYQF38SbX1VMZrDtEYwv3TqHyfRRLNtDmSoUUh-MzNPr2mdRoK4-f7mWSkj05SEC2CSw9SCFCP5TrXXyiQX5XPmfRSxpCDTj1vQXy-AfQ0gw5fpes5wZamGX-tg95YrJqR-2PZb0Pr0xlXWmFrNZ25cy9Lq035MqIC3omDeoX048gTDo6aPyiJJ8ubMy_rrSH8uWunW-JoYx-GYTBu9iWDjU0ItzjdCqdIZbADL3mj52V4CjIQ5JCzbdq5ncYhL7krWvhU-hGNyIPHv6lEBM7PBveE52duX_VotlxvArCV18FRedmkokJtQ0s7znt8w-XkH-g9oKKCHd-7G28rLurBxRxXWoews4cjWekB0VXI9dfFHL99wRtV2Q_fYhxWbZK6Zx95i2djsL6ZzEtLb2w8ZzYKJnfIzstfeTmuR_ZLKIn7DlKXP5z-plcxPn_EpDVFnahsHR8zinsqJ_VzwnSGJrIhM4WagcNxKA7pPUe-MSAKpXIpPx7ybJ3hWWjdEKT8z6NvIZcamVeN1D_TbgubNvOIb7iukyReLhFC9EEFvMIxbTqLJlCraFWheEdBxz2dGyzuQAc996T0S54fLOA_V8aeO1UKiW8FZ-oo3GDywGaOrtwKKIZv2YOYIEKa02foIOJ6gr7lEZAIU5sTh7BHpV1gcSbvRM3mFxwsDYOYCQkLwdCTggWMcEJo9SWy9pQzZryz22AeYW5ujSrbdFTWXEf0KPMHT1z10vhXx6nP60CatLz7d2cAGioHyp5gh8nX9yk49TwxvLPnKf0XA"

/* ---------------------------
DROPBOX SETUP
---------------------------- */
/* ---------------------------
DROPBOX
---------------------------- */

const dbx = new Dropbox({
accessToken:DROPBOX_TOKEN,
fetch:fetch
})

/* ---------------------------
DISTRESS STORAGE
---------------------------- */

let distressSignals = []

/* ---------------------------
CHATBOT
---------------------------- */

app.post("/chat", async (req,res)=>{

const userMessage = req.body.message

if(!userMessage){
return res.json({reply:"No message provided"})
}

try{

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[
{
parts:[
{
text:`You are a calm disaster rescue assistant helping trapped survivors stay calm and give short survival advice.

User message: ${userMessage}`
}
]
}
]
})
})

const data = await response.json()

let reply = "Rescue assistant unavailable."

if(
data &&
data.candidates &&
data.candidates.length > 0 &&
data.candidates[0].content &&
data.candidates[0].content.parts &&
data.candidates[0].content.parts.length > 0
){
reply = data.candidates[0].content.parts[0].text
}

res.json({reply})

}catch(err){

console.log(err)
res.json({reply:"AI server error"})

}

})

/* ---------------------------
STORE DISTRESS SIGNAL
---------------------------- */

app.post("/distress", async (req,res)=>{

try{

let imageUrl=null

if(req.body.image){

const base64=req.body.image.replace(/^data:image\/\w+;base64,/,"")
const buffer=Buffer.from(base64,"base64")

const fileName=`/resqnet_${Date.now()}.png`

await dbx.filesUpload({
path:fileName,
contents:buffer
})

const link = await dbx.sharingCreateSharedLinkWithSettings({
path:fileName
})

imageUrl = link.result.url
.replace("www.dropbox.com","dl.dropboxusercontent.com")
.replace("?dl=0","")

}

const signal={

id:Date.now(),
name:req.body.name,
urgency:req.body.urgency,
people:req.body.people,
lat:req.body.lat,
lng:req.body.lng,
image:imageUrl

}

distressSignals.push(signal)

res.json({status:"stored",signal})

}catch(err){

console.log(err)
res.status(500).json({error:"Upload failed"})

}

})

/* ---------------------------
GET DISTRESS SIGNALS
---------------------------- */

app.get("/distress",(req,res)=>{
res.json(distressSignals)
})

/* ---------------------------
SERVER
---------------------------- */

app.listen(3000,()=>{

console.log("ResQNET server running on port 3000")

})