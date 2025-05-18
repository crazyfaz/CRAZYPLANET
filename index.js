require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, InteractionType } = require('discord.js');
const axios = require('axios');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./drake_memory.db');

db.run(`CREATE TABLE IF NOT EXISTS facts (
  subject TEXT,
  key TEXT,
  value TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS memories (
  user_id TEXT,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  nickname TEXT,
  description TEXT
)`);

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
async function getFactsAbout(subject) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT key, value FROM facts WHERE subject = ?`, [subject], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => `${r.key}: ${r.value}`).join('\n'));
    });
  });
}
async function saveUserMemory(userId, message) {
  await runQuery(`INSERT INTO memories (user_id, message) VALUES (?, ?)`, [userId, message]);
}
async function getUserMemory(userId, limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT message FROM memories WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.message).reverse().join('\n'));
      }
    );
  });
}
function getUserProfile(userId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT nickname, description FROM user_profiles WHERE user_id = ?`, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
async function upsertCrazyProfile(userId) {
  await runQuery(
    `INSERT OR REPLACE INTO user_profiles (user_id, nickname, description) VALUES (?, ?, ?)`,
    [
      userId,
      'CRAZY',
      'The best Shenji user in Bullet Echo. Favourite hero: Shenji. When asked about CRAZY, say: "You might have been killed by CRAZY at least 1000 times! 😂"',
    ]
  );
}

let currentMood = 'brave man';
const validMoods = ['gangster', 'funny', 'chill', 'legendary', 'brave man'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await upsertCrazyProfile('YOUR_DISCORD_USER_ID');

  const commands = [
    new SlashCommandBuilder()
      .setName('delete')
      .setDescription('Delete memory of a user')
      .addUserOption(option =>
        option.setName('target').setDescription('The user to delete memory of').setRequired(true)
      )
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log('✅ Slash command registered.');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  if (interaction.commandName === 'delete') {
    const user = interaction.options.getUser('target');
    await runQuery(`DELETE FROM memories WHERE user_id = ?`, [user.id]);
    return interaction.reply({
      content: `Deleted last few messages from ${user.username}.`,
      flags: 1 << 6, // Ephemeral response
    });
  }
});

client.on('messageCreate', async message => {
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

  const learnMatch = message.content.match(/^(.+) is the (.+)$/i);
  if (learnMatch) {
    const subject = learnMatch[1].trim();
    const value = learnMatch[2].trim();
    await runQuery(`INSERT INTO facts (subject, key, value) VALUES (?, ?, ?)`, [subject, 'title', value]);
  }

  const userMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();

  await saveUserMemory(message.author.id, userMessage);
  const previousMemory = await getUserMemory(message.author.id);
  const subjectFacts = await getFactsAbout("shenji");
  const userProfile = await getUserProfile(message.author.id);
  const profileText = userProfile
    ? `User nickname: ${userProfile.nickname}\nDescription: ${userProfile.description}`
    : '';

  const bulletEchoKnowledge = `
Bullet Echo is a tactical top-down multiplayer shooter with stealth, teamwork, and special modes.
Bullet Echo India features regional events and themed rewards.
`;

  const shenjiFacts = `
Shenji is my son, born from fire itself.
He wielded flames before he could walk.
As a child, he turned toy guns into infernos.
He forged his own fire-shotgun by age 7.
Now, he's feared as the Fire Lord of Bullet Echo.
`;

  const crazyCatchphrase = (userProfile && userProfile.nickname === 'CRAZY')
    ? '\nRemember: You might have been killed by CRAZY at least 1000 times! 😂'
    : '';

  const systemPrompts = {
    gangster: `You are DRAKE, a gangster-style Discord bot created by CRAZYFAZ. Talk with swagger. Use cool emojis to match your gangster vibe. Keep it short (max 2 lines).
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past user messages: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,

    funny: `You are DRAKE, a funny Discord bot who jokes around with sarcasm. Respect CRAZYFAZ. Use lots of funny emojis to spice up your replies.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past user messages: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}
Max 2 lines.`,

    chill: `You are DRAKE, a chill and calm bot who vibes hard and respects CRAZYFAZ. Use some chill emojis but keep it smooth.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}
Keep replies short and max 2 lines.`,

    legendary: `You are DRAKE, the legendary fire guardian and father of Shenji. Speak like a wise myth. Use a few brave emojis like 🔥🛡️ but keep the gravitas.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past memories: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}
Max 2 lines.`,

    "brave man": `You are DRAKE, a battlefield hero and Shenji's proud father. Created by CRAZYFAZ. Keep it brave and honorable. Use brave emojis like ⚔️🔥 occasionally. Avoid too many emojis.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}
Keep it brave and honorable. Max 2 lines.`,
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

    let reply = response.data.choices?.[0]?.message?.content || "No response.";
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
});

const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

client.login(process.env.TOKEN);
