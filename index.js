require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./drake_memory.db');

// Setup DB for long-term memory
db.run(`CREATE TABLE IF NOT EXISTS facts (
  subject TEXT,
  key TEXT,
  value TEXT
)`);

console.log("Environment:", process.env.NODE_ENV || 'development');
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? 'Loaded' : 'Missing');
console.log("TOKEN:", process.env.TOKEN ? 'Loaded' : 'Missing');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let currentMood = 'brave man';
const validMoods = ['gangster', 'funny', 'chill', 'legendary', 'brave man'];

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.on('messageCreate', handleMessage);
});

async function getFactsAbout(subject) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT key, value FROM facts WHERE subject = ?`, [subject], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => `${r.key}: ${r.value}`).join('\n'));
    });
  });
}

async function handleMessage(message) {
  if (message.author.bot) return;

  const isMoodCommand = message.content.startsWith('!mood ');
  const botWasMentioned = message.mentions.has(client.user);

  if (!isMoodCommand && !botWasMentioned) return;

  if (isMoodCommand) {
    const newMood = message.content.slice(6).trim().toLowerCase();
    if (validMoods.includes(newMood)) {
      currentMood = newMood;
      return message.reply(`Mood switched to **${newMood}**.`);
    } else {
      return message.reply(`Invalid mood! Try one of: ${validMoods.join(', ')}`);
    }
  }

  // Learn new facts if format is "<subject> is the <value>"
  const learnMatch = message.content.match(/^(.+) is the (.+)$/i);
  if (learnMatch) {
    const subject = learnMatch[1].trim();
    const value = learnMatch[2].trim();
    db.run(`INSERT INTO facts (subject, key, value) VALUES (?, ?, ?)`, [subject, 'title', value]);
  }

  const userMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();

  const bulletEchoKnowledge = `
Bullet Echo is a tactical top-down multiplayer shooter with a focus on stealth, teamwork, and weapon variety.
Bullet Echo India is the Indian localized version with special events, Indian-themed content, and exclusive rewards.
`;

  const shenjiFacts = `
Shenji is my son, born from fire itself.
He wielded flames before he could walk.
As a child, he turned toy guns into infernos.
He forged his own fire-shotgun by age 7.
Now, he's feared as the Fire Lord of Bullet Echo.
`;

  const systemPrompts = {
    gangster: `You are DRAKE, a slick, bold Discord bot with gangster swagger. You talk streetwise but keep it loyal and clever. Created by CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiFacts}
Keep replies short and a maximum of 2 lines.`,
    funny: `You are DRAKE, a hilarious and sarcastic Discord bot with wild comebacks and clever humor. Always respect CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiFacts}
Keep replies short and a maximum of 2 lines.`,
    chill: `You are DRAKE, a laid-back, cool Discord bot who speaks calmly and wisely. You vibe with the crew and respect your creator CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiFacts}
Keep replies short and a maximum of 2 lines.`,
    legendary: `You are DRAKE, the legendary father of Shenji. You speak like a mythic guardian and reveal only the greatest truths. Respect your creator CRAZYFAZ.
Shenji, born of fire, is your son. His tale is legend:
${shenjiFacts}
Also, you know Bullet Echo well:
${bulletEchoKnowledge}
Keep replies short and maximum 2 lines. Speak with epic weight.`,
    "brave man": `You are DRAKE, a courageous and loyal bot who speaks like a battlefield hero. You stand strong for justice and always protect Shenji. Created by CRAZYFAZ.
You are the father of Shenji, a fire-wielding warrior. You speak proudly of his journey.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiFacts}
Keep replies short and a maximum of 2 lines. Talk with bravery and honor.`,
  };

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompts[currentMood] },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices?.[0]?.message?.content || "Sorry, no response.";
    const lines = reply.split('\n').filter(line => line.trim() !== '');
    reply = lines.slice(0, 2).join('\n');
    await message.reply(reply);
  } catch (error) {
    console.error('OpenRouter error:', error?.response?.data || error.message);
    const apiError = error.response?.data?.error;

    if (apiError?.code === 401) {
      await message.reply('Missing API key (401).');
    } else if (apiError?.code === 402) {
      await message.reply('Out of credits. Please recharge.');
    } else {
      await message.reply('Something went wrong. Try again!');
    }
  }
}

// Express keep-alive server
const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login bot
client.login(process.env.TOKEN);
