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

const DROPBOX_TOKEN = "sl.u.AGVYotD9uF0Yvpfzfvw2VfOkg5gnVbFMdyEF91l38CY6oS-E67vrP8NCTQabei4xosJbXWj_C5TMVcTiahtAB3lz11dE0_X2dMtTwfSV88-EKEU3Cml7OEMNWYFAAon9eer6xRsgsP0xBlXF3dJZxb9rHiMnq_KYgEkp1z5Wig-S-dpiVA-4fqyewcSvgMYP6949p3bQFqOtAe6LQIkElTZ0VLleo1pePGJFaZuWgfT7xaXyzu_mCg5L3rTM0HIKtfgVpcq0F5q6GJcDHEx0xJ5WqsN-tPi8YVdrGJiAtU2J6wSGogRpZXGu2zEkYzT6LkdPXTH4bXq9_4ac-NuO22SdwDtvMMh2YZ4o6aYy-qhmZ-CepNszbIZPyvR106hki3uiWUw7btj3fO37kejzOoTyhYOSJUV9dtYR5rcDihmEEKgX2-xkOjRXfwFxqDTiCRr7MdtgZ0BaxMbORX6HRWdvEoYLSdfVu834rf7V3izyiSxwjxXFZymtAZBjqR2zHh7IoWeltoDAObHT3ly06JbiQASC3qH2JwPoFsTTdlmhz8Z71USvrgQs2E5Tdb26bmoBx8RBuhX9XiGPZ6_kdzhHB6JYJ73CT_MdVdBIWPtvZc-uxR1Ch3yqKCS4Gpf8Q4VX_olrDCUl8rRYYyg8boelmq8f9284vtBavmDWwhc6iqAdKqhpyk6c78rQCoywRGZB2NABLMZdnZIbw-a-mhrebFqEns4ETRniNIdWzHbfVSH0ir9RTqtTQoUUNRwJA_9iipgfQLkks1cN7OrAncR8CHBcE4BcU1emiefIzd3C8am8zaGUR5nggfjmOzFlDHz_uhLM9YRejx71Bpnt3SBpeq7ojGCdq50fDIM2vpC4pJQbW8jdn-KG6gvHgLyCtbJuW_EkZ0p1jLNyf-i_5LuDNuOTBXY6WCG6Uc3yM4p6vHzbfhNiHFKWkKjeMq_-_aMo0VUactuZ5ZJk-xc5vOAUXFseGK4rxi2TfGqgQBGZop4TuHpPNsXf7sAHLK41IIBiyOfRDRGalK8NWI4twXRwlUaYKG76eT76JGhgmUQS6Xk8IAVgj6zaBiifchk0QbHNCK_uKOquKbt3FsKmR4yxjtOi2BdfHmZ7bwLe7nJKhMQuvVr0aCpYfvYwVb13p58CCe1-kz5TpwUAQ3NtiWFewZUkGbNYSwyj_wQ9giUu7HvYC2r28s38gnBKnGwrtMOPev4O5xDA6quc7mMh7oPqEV7mrT5CSbtrMBV-70TuIEK2dF7WDn4wU9q2wqtttmXzkgrqpnwzqA2Qd9HgviQo_ehSss24kkNCeEWrPZAHZk8DPUOqKFAtp58aw-0kXQfLtdkrEejTlOqKcZAqfGQwB1w0uyoxQ1L2vDba6eR04SuCBLXHKkcDrXuPafs_Hw2Bk_W95RmKGh7ksBzXb0YRU3Et4jYdcjT3LShVnl6MDw"

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