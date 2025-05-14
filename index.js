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

client.on('messageCreate', message => {
  const content = message.content.toLowerCase();

  if (content === 'hey planet') {
    message.reply('Hello there,im the CRAZYPLANET!');
  } else if (content === 'help me') {
    message.reply('Help');
  } else if (content === 'bye') {
  message.reply('Goodbye! and dont back again👊😂');
  } else if (content === 'daa myre') {
  message.reply('podaa pundachi mone👊');
  }
});

client.on('messageCreate', async message => {
  if (message.content.startsWith('!clear')) {
    // Only allow you (madboy_0079) to use the command
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
      message.reply('Failed to delete messages. Note: Messages older than 14 days cannot be deleted.');
    }
  }
});

client.login(process.env.TOKEN);

const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 3000);
