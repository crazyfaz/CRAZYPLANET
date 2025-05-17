require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = '1372966958139576340'; // Your channel ID
let currentMood = 'default';

// Allowed moods
const validMoods = ['default', 'funny', 'gangster', 'soft'];

client.once('ready', () => {
  console.log(`${client.user.tag} is now online!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  // Mood switch command
  if (message.content.startsWith('!mood ')) {
    const newMood = message.content.split(' ')[1].toLowerCase();
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
                      Respond naturally and fully in that mood. Keep replies short and concise, no extra fixed greetings.`,
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
    // Handle credits/token limits or other API errors
    if (
      error.response?.data?.error?.code === 402 &&
      error.response?.data?.error?.message.includes('credits')
    ) {
      await message.reply(
        'Sorry, I am out of credits right now and cannot respond. Please try again later.'
      );
    } else {
      console.error('Error generating response:', error.response?.data || error.message);
      await message.reply('Sorry, I had a brain freeze. Try again!');
    }
  }
});

client.login(process.env.TOKEN);
