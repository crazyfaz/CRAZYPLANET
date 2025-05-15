const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('Keep-alive server started on port 3000'));

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as CRAZYPLANET#${client.user.discriminator}`);
});

// Bad word list
const badWords = ['fuck', 'idiot', 'stupid', 'dumb', 'bitch', 'asshole'];

// Specific user IDs
const specificUser1 = '1372278464543068170';
const specificUser2 = '1354501822429265921';

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const mentionedIDs = Array.from(message.mentions.users.keys());

  // Check for bad word
  const hasBadWord = badWords.some(word => content.includes(word));

  // Check if both specific users are mentioned
  const mentionsBoth =
    mentionedIDs.includes(specificUser1) && mentionedIDs.includes(specificUser2);

  // Response for bad words + mentions
  if (hasBadWord && mentionsBoth) {
    return message.reply('Wanna fight ?, then i will use my leg to kick your ass🥱');
  }

  // Fun replies
  if (content === 'hey crimzy') {
    return message.reply('Heheeeyy there, im CRIMZYYYY!');
  } else if (content === 'bye') {
    return message.reply('Go away, and dont back again😂');
  } else if (content === 'daa myre') {
    return message.reply('podaa pundachi mone👊');
  }

  // Clear command
  if (content.startsWith('Clear')) {
    const ownerId = '1354501822429265921';
    if (message.author.id !== ownerId) {
      return message.reply("Only the bot owner can use this command.");
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to delete their messages.');
    }

    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === user.id);
      const deleted = await message.channel.bulkDelete(userMessages, true);
      message.reply(`Deleted ${deleted.size} messages from ${user.tag}`);
    } catch (err) {
      console.error(err);
      message.reply('Failed to delete messages. Messages older than 14 days cannot be deleted.');
    }
  }
});

client.login(process.env.TOKEN);

const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 3000);
