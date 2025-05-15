require('dotenv').config();
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Keep-alive server started on port ${PORT}`));

// === Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const OWNER_ID = process.env.OWNER_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CHANNELS = {
  COMMAND: '1372507857450307654',
  TARGET: '1371516002361413753'
};

const ROLES = {
  MALE: '1372494324465537055',
  FEMALE: '1372494544196603935',
  TEEN: '1372534842582896690',
  ADULT: '1372534966134767708'
};

// === Register Slash Commands ===
const commands = [
  new SlashCommandBuilder().setName('ageroles').setDescription('Post age role selector'),
  new SlashCommandBuilder().setName('genderroles').setDescription('Post gender role selector')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();

// === Bot Ready ===
client.once('ready', () => {
  console.log(`✅ Bot is live as ${client.user.tag}`);
});

// === Interaction Handling ===
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName, guild } = interaction;
    const channel = guild.channels.cache.get(CHANNELS.TARGET);
    if (!channel) return interaction.reply({ content: '⚠️ Target channel not found.', ephemeral: true });

    if (commandName === 'genderroles') {
      const embed = new EmbedBuilder()
        .setColor('#F507FA')
        .setTitle('𝐘𝐨𝐮𝐫 𝐆𝐞𝐧𝐝𝐞𝐫')
        .setDescription('Select your gender from the options below. Only one can be active.')
        .setThumbnail('https://i.postimg.cc/YSnZ70Dy/20250428-191755.png');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gender_male').setLabel('🧔 𝐌𝐀𝐋𝐄').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('gender_female').setLabel('👩 𝐅𝐄𝐌𝐀𝐋𝐄').setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: '✅ Gender role selector posted!', ephemeral: true });
    }

    if (commandName === 'ageroles') {
      const embed = new EmbedBuilder()
        .setColor('#F507FA')
        .setTitle('𝐘𝐨𝐮𝐫 𝐀𝐠𝐞')
        .setDescription('Pick your age category to get the appropriate role.')
        .setThumbnail('https://i.postimg.cc/YSnZ70Dy/20250428-191755.png');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('age_teen').setLabel('🐣 𝐓𝐄𝐄𝐍').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('age_adult').setLabel('🐓 𝐀𝐃𝐔𝐋𝐓').setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: '✅ Age role selector posted!', ephemeral: true });
    }
  }

  if (!interaction.isButton()) return;

  const { customId, member, guild } = interaction;
  const roles = {
    male: guild.roles.cache.get(ROLES.MALE),
    female: guild.roles.cache.get(ROLES.FEMALE),
    teen: guild.roles.cache.get(ROLES.TEEN),
    adult: guild.roles.cache.get(ROLES.ADULT)
  };

  if (!roles.male || !roles.female || !roles.teen || !roles.adult) {
    return interaction.reply({ content: '⚠️ Role configuration error. Please contact admin.', ephemeral: true });
  }

  try {
    switch (customId) {
      case 'gender_male':
        await member.roles.remove(roles.female).catch(() => {});
        if (!member.roles.cache.has(roles.male.id)) await member.roles.add(roles.male);
        return interaction.reply({ content: '✅ You’ve been assigned the **Male** role.', ephemeral: true });

      case 'gender_female':
        await member.roles.remove(roles.male).catch(() => {});
        if (!member.roles.cache.has(roles.female.id)) await member.roles.add(roles.female);
        return interaction.reply({ content: '✅ You’ve been assigned the **Female** role.', ephemeral: true });

      case 'age_teen':
        await member.roles.remove(roles.adult).catch(() => {});
        if (!member.roles.cache.has(roles.teen.id)) await member.roles.add(roles.teen);
        return interaction.reply({ content: '✅ You’ve been assigned the **Teen** role.', ephemeral: true });

      case 'age_adult':
        await member.roles.remove(roles.teen).catch(() => {});
        if (!member.roles.cache.has(roles.adult.id)) await member.roles.add(roles.adult);
        return interaction.reply({ content: '✅ You’ve been assigned the **Adult** role.', ephemeral: true });
    }
  } catch (err) {
    console.error('❌ Interaction error:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Something went wrong assigning roles.', ephemeral: true });
    }
  }
});

// === Message Commands & Filters ===
const badWords = [
  'fuck', 'idiot', 'stupid', 'dumb', 'bitch', 'asshole', 'phuck', 'fck', 'nigga', 'niggha',
  'stfu', 'shut the fuck up', 'stfub', 'shut the fuck up bitch', 'lawde', 'myre'
];
const flaggedUsers = ['1372278464543068170', OWNER_ID];

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Bad word filter on flagged mentions (any channel)
  const mentionedIDs = Array.from(message.mentions.users.keys());
  const hasBadWord = badWords.some(word => content.includes(word));
  const isFlaggedMention = mentionedIDs.some(id => flaggedUsers.includes(id));
  if (hasBadWord && isFlaggedMention) {
    return message.reply('Wanna fight? Then I’ll use my leg to kick your ass 🥱');
  }

  // Fun Replies
  if (content === 'hey crimzy') return message.reply('Heheeeyy there, I’m CRIMZYYYY!');
  if (content === 'bye') return message.reply('Go away, and don’t come back again 😂');
  if (content === 'daa myre') return message.reply('Podaa pundachi mone 👊');

  // Owner-only clear command
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

client.login(process.env.TOKEN);
