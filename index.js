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

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.removeAllListeners('messageCreate');
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Restrict to specific channel only
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

  // Define system prompts per mood with Bullet Echo knowledge
  const systemPrompts = {
    gangster: `You are DRAKE, a bold, streetwise bot created by CRAZYFAZ. You're chill, gangster, and deeply knowledgeable about the game Bullet Echo and Bullet Echo India. You can talk about heroes like Levi, Slayer, Sparkle, game modes like King of the Hill, Team vs Team, Solo, and discuss strategies, weapons, gadgets, or new updates. Reply in gangster tone, but stay smart.`,
    funny: `You are DRAKE, the class clown with deep Bullet Echo knowledge. You crack jokes and drop savage comebacks while helping users learn about Bullet Echo heroes, game modes, updates, tips, and tricks in a sarcastic, funny way. Always honor your creator CRAZYFAZ.`,
    chill: `You are DRAKE, a calm, chill expert on Bullet Echo and Bullet Echo India. You guide users through tactics, hero builds, and updates in a relaxed and helpful way. You know all about maps, heroes, guns, gadgets, and recent updates. You respect your creator CRAZYFAZ above all.`,
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
        max_tokens: 250,
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
app.get('/', (req, res) => res.send('DRAKE is running!'));
app.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login bot
client.login(process.env.TOKEN);
