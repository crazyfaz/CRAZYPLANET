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

let currentMood = 'gangster';
const validMoods = ['gangster', 'funny', 'chill'];

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.removeAllListeners('messageCreate');
client.on('messageCreate', async (message) => {
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

  const userMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();

  const bulletEchoKnowledge = `
Bullet Echo is a tactical top-down multiplayer shooter with a focus on stealth, teamwork, and weapon variety.
Bullet Echo India is the Indian localized version with special events, Indian-themed content, and exclusive rewards.
`;

  const shenjiLore = `
Shenji is my son. I raised him in the flames, taught him to control fire since he was a boy.
He became the Fire Lord, wielding a fiery shotgun called the Dragon’s Roar.
Enemies fear him, fire obeys him. Ask me about his story — I’ll tell you what made him a legend.
`;

  const systemPrompts = {
    gangster: `You are DRAKE, a slick, bold Discord bot with gangster swagger. You talk streetwise but keep it loyal and clever. Created by CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiLore}
Keep replies short and a maximum of 2 lines.`,
    funny: `You are DRAKE, a hilarious and sarcastic Discord bot with wild comebacks and clever humor. Always respect CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiLore}
Keep replies short and a maximum of 2 lines.`,
    chill: `You are DRAKE, a laid-back, cool Discord bot who speaks calmly and wisely. You vibe with the crew and respect your creator CRAZYFAZ.
Knowledge about Bullet Echo, Bullet Echo India, and Shenji:
${bulletEchoKnowledge}
${shenjiLore}
Keep replies short and a maximum of 2 lines.`,
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

    let reply = response.data.choices?.[0]?.message?.content || "Sorry, no response.";
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

// Keep-alive web server
const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

// Login the bot
client.login(process.env.TOKEN);
