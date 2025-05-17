require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Debug: Print key status
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? 'Loaded' : 'Missing');
console.log("TOKEN:", process.env.TOKEN ? 'Loaded' : 'Missing');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = '1372966958139576340';
let currentMood = 'default';
const validMoods = ['default', 'funny', 'gangster', 'soft'];

client.once('ready', () => {
  console.log(`${client.user.tag} is now online!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== CHANNEL_ID) return;

  if (message.content.startsWith('!mood ')) {
    const newMood = message.content.split(' ')[1]?.toLowerCase();
    if (validMoods.includes(newMood)) {
      currentMood = newMood;
      return message.reply(`Mood switched to **${newMood}**!`);
    } else {
      return message.reply(`Invalid mood. Try: ${validMoods.join(', ')}`);
    }
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are CRIMZYY, a Discord bot with a ${currentMood} personality. 
                      Your default memory: Your name is CRIMZYY, you come from the digital world, 
                      your creator is YourName, and your ex-girlfriend's name is Alice. 
                      Respond naturally and fully in that mood. Keep replies short and concise.`,
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
    const apiError = error.response?.data?.error;
    console.error('Error generating response:', apiError || error.message);

    if (apiError?.code === 402 && apiError?.message.includes('credits')) {
      await message.reply('Sorry, I am out of credits right now. Try again later.');
    } else {
      await message.reply('Sorry, I had a brain freeze. Try again!');
    }
  }
});

// Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Web server on port ${PORT}`));

// Start Discord bot
client.login(process.env.TOKEN);
