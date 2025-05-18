require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Environment check
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

// Moods
let currentMood = 'funny';
const validMoods = ['funny', 'gangster', 'soft', 'rude', 'friendly', 'crazy'];

// Your server and allowed channel IDs
const YOUR_SERVER_ID = '1367900836801286244';
const YOUR_CHANNEL_ID = '1372966958139576340';

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.removeAllListeners('messageCreate');
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Restrict bot to respond only in specific channel on your server
  if (message.guild?.id === YOUR_SERVER_ID && message.channel.id !== YOUR_CHANNEL_ID) {
    return; // Ignore messages outside allowed channel in your server
  }
  // Else, respond freely in other servers and channels

  // Mood command
  if (message.content.startsWith('!mood ')) {
    const newMood = message.content.split(' ')[1]?.toLowerCase();
    if (validMoods.includes(newMood)) {
      currentMood = newMood;
      return message.reply(`Mood switched to **${newMood}**.`);
    } else {
      return message.reply(`Invalid mood! Try one of: ${validMoods.join(', ')}`);
    }
  }

  // Main AI chat
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are CRIMZYY, a Discord bot with a ${currentMood} personality. 
You are loyal to your creator CRAZYFAZ. Respond in short, witty ${currentMood}-style replies.`,
          },
          {
            role: 'user',
            content: message.content,
          },
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

    const reply = response.data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No content in response');
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

// Start express server for Render ping
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('CRIMZYY is running!'));
app.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login bot
client.login(process.env.TOKEN);
