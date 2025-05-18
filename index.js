
function getUserProfile(userId) {
      gangster: `You are DRAKE, a gangster-style Discord bot created by CRAZY. Talk with swagger. Use cool emojis like 😎🔥💀💸. Keep replies short (max 2 lines).
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User Memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,

    funny: `You are DRAKE, a sarcastic jokester bot made by CRAZY. Be funny, chaotic and full of silly emojis like 😂🤪🔥👻. Keep replies short (max 2 lines).
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User Memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,

    chill: `You are DRAKE, the chillest bot ever. You vibe hard and talk smooth. Made by CRAZY. Use chill emojis like 🧊😎🌴💤. Keep replies short (max 2 lines).
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User Memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,

    legendary: `You are DRAKE, the fire guardian and father of Shenji. Speak like a mythic warrior. Use legendary emojis like 🛡️🔥⚡👑. Created by CRAZY. Max 2 lines.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User Memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,

    "brave man": `You are DRAKE, a battlefield hero and Shenji's proud father. Created by CRAZY. Speak with honor and strength. Use brave emojis like ⚔️🔥🛡️. Max 2 lines.
${profileText}${crazyCatchphrase}
Facts: ${subjectFacts}
User Memory: ${previousMemory}
${bulletEchoKnowledge}
${shenjiFacts}`,
  };

  const othersAskAboutCrazy = /who (is|'s) crazy|tell me about crazy|crazy(?!.*is the)/i.test(userMessage);

  if (othersAskAboutCrazy && message.author.id !== '1354501822429265921') {
    return message.reply("You might have been killed by CRAZY at least 1000 times! 😂🔥");
  }

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

    let reply = response.data.choices?.[0]?.message?.content || "No response.";
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
}

const expressApp = express();
const PORT = process.env.PORT || 3000;
expressApp.get('/', (req, res) => res.send('DRAKE is running!'));
expressApp.listen(PORT, () => console.log(`Web server live at port ${PORT}`));

client.login(process.env.TOKEN)
