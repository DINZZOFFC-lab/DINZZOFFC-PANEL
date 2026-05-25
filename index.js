const {
default: makeWASocket,
useMultiFileAuthState,
downloadMediaMessage
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")
const { Sticker } = require("wa-sticker-formatter")

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms))
}

const addUser = {}

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("./session")

const sock = makeWASocket({
logger: P({ level: "silent" }),
auth: state,
browser: ["DINZZOFFC", "Chrome", "1.0.0"],
printQRInTerminal: false
})

const readline = require("readline")

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const question = (text) => {
return new Promise((resolve) => {
rl.question(text, resolve)
})
}

if (!sock.authState.creds.registered) {

const phoneNumber = await question(
"MASUKKAN NOMOR AWALI 62 : "
)

const code = await sock.requestPairingCode(phoneNumber)

console.log(`
╭──────────────
│ KING-DINZZ
│ PAIRING CODE
│
│ ${code}
│
╰──────────────
`)
}
sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", ({ connection }) => {

if (connection === "open") {
console.log("DINZZOFFC CONNECTED")
}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return

const from = msg.key.remoteJid
const isGroup = from.endsWith("@g.us")

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

const prefix = "."

if (!body.startsWith(prefix)) return

const command = body.slice(1).split(" ")[0]
const text = body.split(" ").slice(1).join(" ")

const reply = (teks) => {
sock.sendMessage(from, { text: teks }, { quoted: msg })
}

// MENU
if (command === "menu") {

let teks = `
╭───「 DINZZOFFC 」
│
│ .menu
│ .ping
│ .sticker
│ .confess
│ .add
│
╰────────────
`

await sock.sendMessage(from, {
text: teks
})

}

// PING
if (command === "ping") {

await sock.sendMessage(from, {
text: "Pong 🏓"
})

}

// STICKER
if (command === "sticker") {

let quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

if (!quoted) {
return sock.sendMessage(from, {
text: "Reply gambar dengan .sticker"
})
}

let qmsg = {
key: msg.key,
message: quoted
}

const buffer = await downloadMediaMessage(
qmsg,
"buffer",
{},
{
logger: P({ level: "silent" }),
reuploadRequest: sock.updateMediaMessage
}
)

const sticker = new Sticker(buffer, {
pack: "DINZZOFFC",
author: "DINZZOFFC",
type: "full"
})

const stickerBuffer = await sticker.toBuffer()

await sock.sendMessage(from, {
sticker: stickerBuffer
})

}

// CONFESS DELAY
if (command === "confess") {

if (!text) {
return reply(
`Contoh:
.confess 628xxx|halo|10`
)
}

let [nomor, pesan, waktu] = text.split("|")

if (!nomor || !pesan) {
return reply("Format salah")
}

nomor = nomor.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

let delay = waktu ? parseInt(waktu) : 10

if (isNaN(delay)) delay = 10

reply(`⏳ Confess akan dikirim ${delay} detik lagi`)

await sleep(delay * 1000)

let teks = `
╭──『 CONFESS 💌 』
│
│ ${pesan}
│
╰────────────
`

await sock.sendMessage(nomor, {
text: teks
})

reply("✅ Confess berhasil dikirim")

}

// ADD MEMBER
if (command === "add") {

if (!isGroup) return reply("Khusus grup")

if (!text) {
return reply(
`Contoh:
.add 628xxxx`
)
}

let nomor = text.replace(/[^0-9]/g, "")

if (addUser[from]) {
return reply(
`MINTA IZIN SAMA KING DINZZ DULU YA `
)
}

addUser[from] = true

await reply("⏳ Sedang add member...")

for (let i = 0; i < 1; i++) {

await sock.groupParticipantsUpdate(
from,
[nomor + "@s.whatsapp.net"],
"add"
)

await sleep(3000)

}

reply("✅ Berhasil add 1 member")

setTimeout(() => {
delete addUser[from]
}, 10000)

}

})

}

startBot()
