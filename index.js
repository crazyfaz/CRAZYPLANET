require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

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
let currentMood = 'gangster';
const validMoods = ['gangster', 'funny', 'chill'];

// Track message IDs already replied to (to prevent double replies)
const repliedMessages = new Set();

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Prevent replying twice to same message
  if (repliedMessages.has(message.id)) return;
  repliedMessages.add(message.id);
  // Clean up memory after 1 minute
  setTimeout(() => repliedMessages.delete(message.id), 60000);

  // Restrict to specific channel only on your server
  if (message.guild?.id === '1367900836801286244') {
    if (message.channel.id !== '1372966958139576340') return;
  }

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

  // Define system prompts per mood
  const systemPrompts = {
    gangster: `You are CRIMZYY, a slick, bold Discord bot with gangster swagger. You talk streetwise but keep it loyal and clever. Created by CRAZYFAZ.`,
    funny: `You are CRIMZYY, a hilarious and sarcastic Discord bot with wild comebacks and clever humor. Always respect CRAZYFAZ.`,
    chill: `You are CRIMZYY, a laid-back, cool Discord bot who speaks calmly and wisely. You vibe with the crew and respect your creator CRAZYFAZ.`,
  };

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompts[currentMood],
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

// Render keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('CRIMZYY is running!'));
app.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login bot
client.login(process.env.TOKEN)
