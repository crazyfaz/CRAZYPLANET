require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');
const axios = require('axios');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./drake_memory.db');

db.run(`CREATE TABLE IF NOT EXISTS facts (subject TEXT, key TEXT, value TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS memories (user_id TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.run(`CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY, nickname TEXT, description TEXT)`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();

const deleteCommand = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Delete last 50 messages from a user')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The user whose messages will be deleted')
      .setRequired(true)
  );

const commands = [deleteCommand.toJSON()];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash command registered.');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
})();

async function runQuery(sql, params = []) {
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
    db.all(`SELECT message FROM memories WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`, [userId, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.message).reverse().join('\n'));
    });
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
      'The best Shenji user in Bullet Echo. Favourite hero: Shenji. When asked about CRAZY, say: "You might have been killed by CRAZY at least 1000 times! 😂"'
    ]
  );
}

let currentMood = 'brave man';
const validMoods = ['gangster', 'funny', 'chill', 'legendary', 'brave man'];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await upsertCrazyProfile(process.env.OWNER_ID);
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
  const profileText = userProfile ? `User nickname: ${userProfile.nickname}\nDescription: ${userProfile.description}` : '';
  const crazyCatchphrase = (userProfile && userProfile.nickname === 'CRAZY')
    ? '\nRemember: You might have been killed by CRAZY at least 1000 times! 😂'
    : '';

  const systemPrompts = {
    gangster: `You are DRAKE, a gangster-style Discord bot created by CRAZYFAZ. Talk with swagger.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past user messages: ${previousMemory}`,

    funny: `You are DRAKE, a funny Discord bot who jokes around with sarcasm. Use emojis.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past user messages: ${previousMemory}`,

    chill: `You are DRAKE, a chill bot. Be smooth.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User memory: ${previousMemory}`,

    legendary: `You are DRAKE, a fire guardian and Shenji's father.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
Past memories: ${previousMemory}`,

    "brave man": `You are DRAKE, battlefield hero and Shenji's father.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User memory: ${previousMemory}`,
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

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'delete') {
    const target = interaction.options.getUser('target');
    const channel = interaction.channel;

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(m => m.author.id === target.id);
      const toDelete = Array.from(userMessages.values()).slice(0, 50);

      await Promise.all(toDelete.map(msg => msg.delete()));

      await interaction.reply({
        content: `Deleted last ${toDelete.length} messages from <@${target.id}>.`,
        flags: 1 << 6
      });
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: 'Failed to delete messages.',
        });
      } else {
        await interaction.reply({
          content: 'Failed to delete messages.',
          flags: 1 << 6
        });
      }
    }
  }
});

const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

client.login(process.env.TOKEN);
