const crypto = require("crypto");

const fetch = require("node-fetch");

const TelegramBot = require("node-telegram-bot-api");

// Create a new bot instance with your token

const token = '7361099428:AAHsbnKKUK_aYNsPZNX4BqMLPg3su79JG90'; // Replace with your bot token

const bot = new TelegramBot(token, { polling: true });

let spamSessions = []; // Array to store spam sessions

let currentSessionId = 1; // ID for the current spam session

// Function to send messages

const sendMessage = async (username, message, chatId, sessionId) => {

    let counter = 0; // Counter for messages sent in this session

    while (spamSessions[sessionId - 1]?.isActive) { // Check if the session is still active

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

                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before trying again

            } else {

                counter++;

                console.log(`[Msg] Session ${sessionId}: Sent ${counter} messages.`);

                bot.sendMessage(chatId, `Session ${sessionId}: Sent ${counter} messages.`);

            }

            // Wait before sending the next message

            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds

        } catch (error) {

            console.error(`[Error] ${error}`);

            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before trying again

        }

    }

};

// Telegram bot commands

bot.onText(/\/start/, (msg) => {

    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Choose an option:", {

        reply_markup: {

            keyboard: [

                [{ text: "Start Spam" }, { text: "List Spam" }],

            ],

            resize_keyboard: true,

            one_time_keyboard: true

        }

    });

});

// Handle the 'Start Spam' button

bot.onText(/Start Spam/, (msg) => {

    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Enter username:");

    bot.once("message", (msg) => {

        const username = msg.text;

        bot.sendMessage(chatId, "Enter message:");

        bot.once("message", (msg) => {

            const message = msg.text;

            spamSessions.push({ id: currentSessionId, username, message, isActive: true });

            sendMessage(username, message, chatId, currentSessionId);

            bot.sendMessage(chatId, `Spam session ${currentSessionId} started!`);

            currentSessionId++; // Increment session ID for the next spam session

        });

    });

});

// Handle the 'List Spam' button

bot.onText(/List Spam/, (msg) => {

    const chatId = msg.chat.id;

    if (spamSessions.length > 0) {

        let listMessage = "Current spam sessions:\n";

        spamSessions.forEach(session => {

            listMessage += `${session.id}: ${session.username} - ${session.message} [Active: ${session.isActive}]\n`;

        });

        const buttons = spamSessions.map(session => [{

            text: `Stop Session ${session.id}`, 

            callback_data: `stop_${session.id}`

        }]);

        bot.sendMessage(chatId, listMessage, {

            reply_markup: {

                inline_keyboard: buttons

            }

        });

    } else {

        bot.sendMessage(chatId, "No spam sessions are currently running.");

    }

});

// Handle the 'Stop Session' button

bot.on("callback_query", (query) => {

    const chatId = query.message.chat.id;

    const sessionId = parseInt(query.data.split("_")[1]);

    if (spamSessions[sessionId - 1]) {

        spamSessions[sessionId - 1].isActive = false; // Stop the specific session

        bot.sendMessage(chatId, `Spam session ${sessionId} has been stopped.`);

    } else {

        bot.sendMessage(chatId, `No spam session found with ID ${sessionId}.`);

    }

});

