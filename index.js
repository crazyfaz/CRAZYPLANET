const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Mood system
let currentMood = 'funny';
const validMoods = ['funny', 'gangster', 'soft', 'rude', 'friendly', 'crazy'];

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
  console.log('Registered event listeners:', client.listenerCount('messageCreate'));
});

client.on('messageCreate', async (message) => {
  // Don't respond to other bots (or itself)
  if (message.author.bot) return;

  // Optional: only respond in specific channel
  // if (message.channel.id !== 'YOUR_CHANNEL_ID') return;

  // Handle mood switching
  if (message.content.startsWith('!mood ')) {
    const newMood = message.content.split(' ')[1]?.toLowerCase();
    if (validMoods.includes(newMood)) {
      currentMood = newMood;
      return message.reply(`Mood updated to **${newMood}**.`);
    } else {
      return message.reply(`Invalid mood! Try one of: ${validMoods.join(', ')}`);
    }
  }

  // Main OpenRouter AI chat
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are CRIMZYY, a Discord bot with a ${currentMood} personality. You are loyal to your creator CRAZYFAZ. Keep replies short, witty, and in ${currentMood} tone.`,
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
      await message.reply('Oops! My brain is locked. Missing API key (401).');
    } else if (apiError?.code === 402) {
      await message.reply('Sorry, I am out of OpenRouter credits. Recharge me boss!');
    } else {
      await message.reply('Sorry, I had a brain freeze. Try again!');
    }
  }
});

client.login(process.env.TOKEN);
