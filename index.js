const crypto = require("crypto");
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");

const token = '7361099428:AAHsbnKKUK_aYNsPZNX4BqMLPg3su79JG90'; // Ganti dengan token bot Anda
const bot = new TelegramBot(token, { polling: true });

let spamSessions = []; // Array untuk menyimpan sesi spam
let currentSessionId = 1; // ID untuk sesi spam saat ini

// Fungsi untuk mengirim pesan
const sendMessage = async (username, message, chatId, sessionId) => {
    let counter = 0; // Counter untuk pesan yang sudah dikirim
    while (spamSessions[sessionId - 1]?.isActive) {
        try {
            const deviceId = crypto.randomBytes(21).toString("hex");
            const url = "https://ngl.link/api/submit";
            const headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Referer": `https://ngl.link/${username}`,
                "Origin": "https://ngl.link"
            };
            const body = `username=${username}&question=${message}&deviceId=${deviceId}&gameSlug=&referrer=`;
            const response = await fetch(url, {
                method: "POST",
                headers,
                body,
                mode: "cors",
                credentials: "include"
            });

            if (response.status !== 200) {
                console.log(`[Error] Rate-limited, waiting 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                counter++;
                console.log(`[Msg] Session ${sessionId}: Sent ${counter} messages.`);
                bot.sendMessage(chatId, `Session ${sessionId}: Sent ${counter} messages.`);
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); // Tunggu 2 detik sebelum mengirim pesan berikutnya
        } catch (error) {
            console.error(`[Error] ${error}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Perintah untuk memulai bot
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Selamat datang di SpamBot! Pilih fitur yang tersedia:", {
        reply_markup: {
            keyboard: [
                [{ text: "Start Spam" }, { text: "List Spam" }],
                [{ text: "Fitur Bot" }]
            ],
            resize_keyboard: true
        }
    });
});

// Handle tombol "Start Spam"
bot.onText(/Start Spam/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Masukkan username yang ingin di-spam:");
    bot.once("message", (msg) => {
        const username = msg.text;
        bot.sendMessage(chatId, "Masukkan pesan yang ingin dikirim:");
        bot.once("message", (msg) => {
            const message = msg.text;
            spamSessions.push({ id: currentSessionId, username, message, isActive: true });
            sendMessage(username, message, chatId, currentSessionId);
            bot.sendMessage(chatId, `Spam session ${currentSessionId} dimulai!`);
            currentSessionId++;
        });
    });
});

// Handle tombol "List Spam"
bot.onText(/List Spam/, (msg) => {
    const chatId = msg.chat.id;
    if (spamSessions.length > 0) {
        let listMessage = "Sesi spam saat ini:\n";
        spamSessions.forEach(session => {
            listMessage += `${session.id}: ${session.username} - ${session.message} [Aktif: ${session.isActive}]\n`;
        });

        const buttons = spamSessions.map(session => [{
            text: `Hentikan Session ${session.id}`,
            callback_data: `stop_${session.id}`
        }]);

        bot.sendMessage(chatId, listMessage, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    } else {
        bot.sendMessage(chatId, "Tidak ada sesi spam yang aktif.");
    }
});

// Handle tombol "Fitur Bot"
bot.onText(/Fitur Bot/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Berikut adalah fitur-fitur yang tersedia:\n" +
        "1. Start Spam - Memulai sesi spam ke username tertentu.\n" +
        "2. List Spam - Melihat daftar sesi spam yang sedang berjalan.\n" +
        "3. Hentikan Spam - Menghentikan sesi spam yang aktif.\n" +
        "\nGunakan fitur-fitur ini dengan bijak.");
});

// Handle callback query untuk menghentikan sesi spam
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const sessionId = parseInt(query.data.split("_")[1]);
    if (spamSessions[sessionId - 1]) {
        spamSessions[sessionId - 1].isActive = false; // Menghentikan sesi tertentu
        bot.sendMessage(chatId, `Sesi spam ${sessionId} telah dihentikan.`);
    } else {
        bot.sendMessage(chatId, `Tidak ditemukan sesi spam dengan ID ${sessionId}.`);
    }
});
