const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('Keep-alive server started on port 3000'));

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers  // Needed for role management
  ]
});

// Role IDs
const MALE_ROLE_ID = '1372494324465537055';
const FEMALE_ROLE_ID = '1372494544196603935';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '/genderroles') {
    const embed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('Your gender')
      .setDescription('You can choose only male or female option from this role picker')
      .setThumbnail('https://i.postimg.cc/YSnZ70Dy/20250428-191755.png');

    const maleButton = new ButtonBuilder()
      .setCustomId('gender_male')
      .setLabel('🧔𝐌𝐀𝐋𝐄')
      .setStyle(ButtonStyle.Primary);

    const femaleButton = new ButtonBuilder()
      .setCustomId('gender_female')
      .setLabel('👩𝐅𝐄𝐌𝐀𝐋𝐄')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(maleButton, femaleButton);

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  // Your existing bad words and other message commands...
  const badWords = ['fuck', 'idiot', 'stupid', 'dumb', 'bitch', 'asshole', 'phuck', 'fck', 'nigga', 'niggha', 'stfu', 'shut the fuck up', 'stfub', 'shut the fuck up bitch', 'lawde', 'myre'];
  const specificUser1 = '1372278464543068170';
  const specificUser2 = '1354501822429265921';

  const content = message.content.toLowerCase();
  const mentionedIDs = Array.from(message.mentions.users.keys());
  const hasBadWord = badWords.some(word => content.includes(word));
  const mentionsEither = mentionedIDs.includes(specificUser1) || mentionedIDs.includes(specificUser2);

  if (hasBadWord && mentionsEither) {
    return message.reply('Wanna fight ?, then i will use my leg to kick your ass🥱');
  }

  if (content === 'hey crimzy') {
    return message.reply('Heheeeyy there, im CRIMZYYYY!');
  } else if (content === 'bye') {
    return message.reply('Go away, and dont back again😂');
  } else if (content === 'daa myre') {
    return message.reply('podaa pundachi mone👊');
  }

  if (content.startsWith('clear')) {
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

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    const member = interaction.member;
    const maleRole = interaction.guild.roles.cache.get(MALE_ROLE_ID);
    const femaleRole = interaction.guild.roles.cache.get(FEMALE_ROLE_ID);

    if (!maleRole || !femaleRole) {
      return interaction.reply({ content: 'Role(s) not found.', ephemeral: true });
    }

    if (interaction.customId === 'gender_male') {
      // Remove female role if present, add male role if missing
      await member.roles.remove(femaleRole).catch(() => {});
      if (!member.roles.cache.has(maleRole.id)) {
        await member.roles.add(maleRole);
      }
      await interaction.reply({ content: 'You got the Male role!', ephemeral: true });
    } else if (interaction.customId === 'gender_female') {
      // Remove male role if present, add female role if missing
      await member.roles.remove(maleRole).catch(() => {});
      if (!member.roles.cache.has(femaleRole.id)) {
        await member.roles.add(femaleRole);
      }
      await interaction.reply({ content: 'You got the Female role!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
