const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000, () => console.log('Keep-alive server started.'));

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Constants for roles and channels
const ROLES = {
  MALE: '1372494324465537055',
  FEMALE: '1372494544196603935',
  TEEN: '1372534842582896690',
  ADULT: '1372534966134767708'
};

const CHANNELS = {
  COMMAND: '1372507857450307654',
  TARGET: '1371516002361413753'
};

const OWNER_ID = '1354501822429265921';

// Word filter
const badWords = [
  'fuck', 'idiot', 'stupid', 'dumb', 'bitch', 'asshole', 'phuck', 'fck', 'nigga', 'niggha',
  'stfu', 'shut the fuck up', 'stfub', 'shut the fuck up bitch', 'lawde', 'myre'
];

const flaggedUsers = ['1372278464543068170', OWNER_ID];

client.once('ready', () => {
  console.log(`✅ Bot is live as ${client.user.tag}`);
});

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // === Gender Role Command ===
  if (message.channel.id === CHANNELS.COMMAND && content === '/genderroles') {
    const channel = message.guild.channels.cache.get(CHANNELS.TARGET);
    if (!channel) return message.reply("⚠️ Target channel not found.");

    const embed = new EmbedBuilder()
      .setColor('#F507FA')
      .setTitle('Your Gender')
      .setDescription('Select your gender from the options below. Only one can be active.')
      .setThumbnail('https://i.postimg.cc/YSnZ70Dy/20250428-191755.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('gender_male').setLabel('🧔 MALE').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('gender_female').setLabel('👩 FEMALE').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return message.reply('✅ Gender role selector posted!');
  }

  // === Age Role Command ===
  if (message.channel.id === CHANNELS.COMMAND && content === '/ageroles') {
    const channel = message.guild.channels.cache.get(CHANNELS.TARGET);
    if (!channel) return message.reply("⚠️ Target channel not found.");

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Your Age Group')
      .setDescription('Pick your age category to get the appropriate role.')
      .setThumbnail('https://i.postimg.cc/SKXzTNQ6/age-thumbnail.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('age_teen').setLabel('🧒 TEEN').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('age_adult').setLabel('🧑 ADULT').setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return message.reply('✅ Age role selector posted!');
  }

  // === Bad Word Filter on Specific Mentions ===
  const mentionedIDs = Array.from(message.mentions.users.keys());
  const hasBadWord = badWords.some(word => content.includes(word));
  const isFlaggedMention = mentionedIDs.some(id => flaggedUsers.includes(id));

  if (hasBadWord && isFlaggedMention) {
    return message.reply('Wanna fight? Then I’ll use my leg to kick your ass 🥱');
  }

  // === Fun Replies ===
  if (content === 'hey crimzy') return message.reply('Heheeeyy there, I’m CRIMZYYYY!');
  if (content === 'bye') return message.reply('Go away, and don’t come back again 😂');
  if (content === 'daa myre') return message.reply('Podaa pundachi mone 👊');

  // === Owner-only Clear Command ===
  if (content.startsWith('clear')) {
    if (message.author.id !== OWNER_ID) return message.reply("⛔ Only the bot owner can use this command.");

    const user = message.mentions.users.first();
    if (!user) return message.reply('Please mention a user to clear their messages.');

    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === user.id);
      const deleted = await message.channel.bulkDelete(userMessages, true);
      message.reply(`✅ Cleared ${deleted.size} messages from ${user.tag}`);
    } catch (err) {
      console.error(err);
      message.reply('⚠️ Failed to delete messages. Messages older than 14 days can’t be deleted.');
    }
  }
});

// Interaction Handler for Buttons
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, member, guild } = interaction;

  const roles = {
    male: guild.roles.cache.get(ROLES.MALE),
    female: guild.roles.cache.get(ROLES.FEMALE),
    teen: guild.roles.cache.get(ROLES.TEEN),
    adult: guild.roles.cache.get(ROLES.ADULT)
  };

  try {
    switch (customId) {
      case 'gender_male':
        await member.roles.remove(roles.female).catch(() => {});
        if (!member.roles.cache.has(roles.male.id)) await member.roles.add(roles.male);
        await interaction.reply({ content: '✅ You’ve been assigned the **Male** role.', ephemeral: true });
        break;

      case 'gender_female':
        await member.roles.remove(roles.male).catch(() => {});
        if (!member.roles.cache.has(roles.female.id)) await member.roles.add(roles.female);
        await interaction.reply({ content: '✅ You’ve been assigned the **Female** role.', ephemeral: true });
        break;

      case 'age_teen':
        await member.roles.remove(roles.adult).catch(() => {});
        if (!member.roles.cache.has(roles.teen.id)) await member.roles.add(roles.teen);
        await interaction.reply({ content: '✅ You’ve been assigned the **Teen** role.', ephemeral: true });
        break;

      case 'age_adult':
        await member.roles.remove(roles.teen).catch(() => {});
        if (!member.roles.cache.has(roles.adult.id)) await member.roles.add(roles.adult);
        await interaction.reply({ content: '✅ You’ve been assigned the **Adult** role.', ephemeral: true });
        break;
    }
  } catch (error) {
    console.error('❌ Interaction error:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Something went wrong while assigning the role.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
