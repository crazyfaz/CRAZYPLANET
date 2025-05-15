require('dotenv').config();
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Keep-alive server started on port ${PORT}`));

// === Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const OWNER_ID = process.env.OWNER_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CHANNELS = {
  COMMAND: '1372507857450307654',
  TARGET: '1371516002361413753'
};

const ROLES = {
  MALE: '1372494324465537055',
  FEMALE: '1372494544196603935',
  TEEN: '1372534842582896690',
  ADULT: '1372534966134767708'
};

// === Message Commands & Filters ===
const badWords = [
  'fuck', 'idiot', 'stupid', 'dumb', 'bitch', 'asshole', 'phuck', 'fck', 'nigga', 'niggha',
  'stfu', 'shut the fuck up', 'stfub', 'shut the fuck up bitch', 'lawde', 'myre'
];
const flaggedUsers = ['1372278464543068170', OWNER_ID];

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Bad word filter on flagged mentions (any channel)
  const mentionedIDs = Array.from(message.mentions.users.keys());
  const hasBadWord = badWords.some(word => content.includes(word));
  const isFlaggedMention = mentionedIDs.some(id => flaggedUsers.includes(id));
  if (hasBadWord && isFlaggedMention) {
    return message.reply('Wanna fight? Then I’ll use my leg to kick your ass 🥱');
  }

  // Fun Replies
  if (content === 'hey crimzy') return message.reply('Heheeeyy there, I’m CRIMZYYYY!');
  if (content === 'bye') return message.reply('Go away, and don’t come back again 😂');
  if (content === 'daa myre') return message.reply('Podaa pundachi mone 👊');

  // Owner-only clear command
  if (content.startsWith('clear')) {
    if (message.author.id !== OWNER_ID) return message.reply("⛔ Only the bot owner can use this command.");
    const user = message.mentions.users.first();
    if (!user) return message.reply('Please mention a user to clear their messages.');
    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === user.id);
      const deleted = await message.channel.bulkDelete(userMessages, true);
      message.reply(`✅ Cleared ${deleted.size} messages from ${user.tag}`);
    } catch (err) {
      console.error(err);
      message.reply('⚠️ Failed to delete messages. Messages older than 14 days can’t be deleted.');
    }
  }
});

client.login(process.env.TOKEN);
