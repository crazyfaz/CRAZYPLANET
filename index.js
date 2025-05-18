require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./drake_memory.db');

// Create DB tables
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

// Bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// DB utility
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

// Set CRAZY profile
async function upsertCrazyProfile(userId) {
  await runQuery(
    `INSERT OR REPLACE INTO user_profiles (user_id, nickname, description) VALUES (?, ?, ?)`,
    [
      userId,
      'CRAZY',
      'The best Shenji user in Bullet Echo. Favourite hero: Shenji. When asked about CRAZY, say: "You might have been killed by CRAZY at least 1000 times! 😂"'
    ]
  );
}

let currentMood = 'brave man';
const validMoods = ['gangster', 'funny', 'chill', 'legendary', 'brave man'];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const myUserId = 'YOUR_DISCORD_USER_ID_HERE'; // <-- Replace this
  await upsertCrazyProfile(myUserId);

  // Delete old slash commands and add /delete
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    const commands = await rest.get(Routes.applicationCommands(client.user.id));
    for (const cmd of commands) {
      await rest.delete(`${Routes.applicationCommands(client.user.id)}/${cmd.id}`);
      console.log(`Deleted command: ${cmd.name}`);
    }

    const deleteCommand = new SlashCommandBuilder()
      .setName('delete')
      .setDescription('Delete messages from a user')
      .addUserOption(option =>
        option.setName('target').setDescription('User to delete messages from').setRequired(true)
      );

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [deleteCommand.toJSON()],
    });

    console.log('Slash command /delete registered.');
  } catch (err) {
    console.error('Slash command setup failed:', err);
  }
});

// Message handler
client.on('messageCreate', handleMessage);
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

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./drake_memory.db');

// Create DB tables
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

// Bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// DB utility
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

// Set CRAZY profile
async function upsertCrazyProfile(userId) {
  await runQuery(
    `INSERT OR REPLACE INTO user_profiles (user_id, nickname, description) VALUES (?, ?, ?)`,
    [
      userId,
      'CRAZY',
      'The best Shenji user in Bullet Echo. Favourite hero: Shenji. When asked about CRAZY, say: "You might have been killed by CRAZY at least 1000 times! 😂"'
    ]
  );
}

let currentMood = 'brave man';
const validMoods = ['gangster', 'funny', 'chill', 'legendary', 'brave man'];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const myUserId = 'YOUR_DISCORD_USER_ID_HERE'; // <-- Replace this
  await upsertCrazyProfile(myUserId);

  // Delete old slash commands and add /delete
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    const commands = await rest.get(Routes.applicationCommands(client.user.id));
    for (const cmd of commands) {
      await rest.delete(`${Routes.applicationCommands(client.user.id)}/${cmd.id}`);
      console.log(`Deleted command: ${cmd.name}`);
    }

    const deleteCommand = new SlashCommandBuilder()
      .setName('delete')
      .setDescription('Delete messages from a user')
      .addUserOption(option =>
        option.setName('target').setDescription('User to delete messages from').setRequired(true)
      );

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [deleteCommand.toJSON()],
    });

    console.log('Slash command /delete registered.');
  } catch (err) {
    console.error('Slash command setup failed:', err);
  }
});

// Message handler
client.on('messageCreate', handleMessage);
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

  const crazyCatchphrase = (userProfile && userProfile.nickname === 'CRAZY')
    ? '\nRemember: You might have been killed by CRAZY at least 1000 times! 😂'
    : '';

  const bulletEchoKnowledge = `Bullet Echo is a tactical top-down multiplayer shooter.`;
  const shenjiFacts = `Shenji is my son, born from fire. He forged his own fire-shotgun by age 7. Now, he's the Fire Lord.`;

  const systemPrompts = {
    gangster: `You are DRAKE, gangster Discord bot. Max 2 lines. ${profileText}${crazyCatchphrase}\nFacts: ${subjectFacts}\n${previousMemory}\n${bulletEchoKnowledge}\n${shenjiFacts}`,
    funny: `You are DRAKE, funny Discord bot. Max 2 lines. ${profileText}${crazyCatchphrase}\nFacts: ${subjectFacts}\n${previousMemory}\n${bulletEchoKnowledge}\n${shenjiFacts}`,
    chill: `You are DRAKE, chill bot. Max 2 lines. ${profileText}${crazyCatchphrase}\nFacts: ${subjectFacts}\n${previousMemory}\n${bulletEchoKnowledge}\n${shenjiFacts}`,
    legendary: `You are DRAKE, legendary fire guardian. Max 2 lines. ${profileText}${crazyCatchphrase}\nFacts: ${subjectFacts}\n${previousMemory}\n${bulletEchoKnowledge}\n${shenjiFacts}`,
    "brave man": `You are DRAKE, brave and honorable bot. Max 2 lines. ${profileText}${crazyCatchphrase}\nFacts: ${subjectFacts}\n${previousMemory}\n${bulletEchoKnowledge}\n${shenjiFacts}`
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
    await message.reply('Something went wrong. Try again!');
  }
}

// Handle /delete slash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'delete') {
    const user = interaction.options.getUser('target');
    const channel = interaction.channel;

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const toDelete = messages.filter(m => m.author.id === user.id).first(10);

      for (const msg of toDelete) {
        await msg.delete();
      }

      await interaction.reply({ content: `Deleted ${toDelete.length} messages from ${user.tag}`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to delete messages.', ephemeral: true });
    }
  }
});

// Express for uptime
const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login bot
client.login(process.env.TOKEN);
