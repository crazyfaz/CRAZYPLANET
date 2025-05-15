require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const OWNER_ID = process.env.OWNER_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CHANNELS = {
  TARGET: '1371516002361413753' // update to your target channel ID
};

const ROLES = {
  MALE: '1372494324465537055',
  FEMALE: '1372494544196603935',
  TEEN: '1372534842582896690',
  ADULT: '1372534966134767708'
};

const commands = [
  new SlashCommandBuilder().setName('ageroles').setDescription('Post age role selector'),
  new SlashCommandBuilder().setName('genderroles').setDescription('Post gender role selector')
].map(cmd => cmd.toJSON());

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot is live as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const { commandName, guild, customId, member } = interaction;
  const channel = guild.channels.cache.get(CHANNELS.TARGET);

  if (interaction.isChatInputCommand()) {
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const OWNER_ID = process.env.OWNER_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CHANNELS = {
  TARGET: '1371516002361413753' // update to your target channel ID
};

const ROLES = {
  MALE: '1372494324465537055',
  FEMALE: '1372494544196603935',
  TEEN: '1372534842582896690',
  ADULT: '1372534966134767708'
};

const commands = [
  new SlashCommandBuilder().setName('ageroles').setDescription('Post age role selector'),
  new SlashCommandBuilder().setName('genderroles').setDescription('Post gender role selector')
].map(cmd => cmd.toJSON());

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot is live as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const { commandName, guild, customId, member } = interaction;
  const channel = guild.channels.cache.get(CHANNELS.TARGET);

  if (interaction.isChatInputCommand()) {
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

  if (interaction.isButton()) {
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
  }
});

client.login(process.env.TOKEN);
