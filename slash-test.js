const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
  Partials,
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

// CHANNEL & ROLE IDs
const COMMAND_CHANNEL = '1372507857450307654';
const TARGET_CHANNEL = '1371516002361413753';
const MALE_ROLE = '1371516002361413753';
const FEMALE_ROLE = '1372494544196603935';

client.once(Events.ClientReady, () => {
  console.log(`Bot is ready as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'genderrole') {
    if (interaction.channelId !== COMMAND_CHANNEL) {
      return interaction.reply({
        content: 'This command can only be used in the designated setup channel.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Your Gender')
      .setDescription('Choose your gender for select your role in this server')
      .setColor(0x00bfff);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('select_male')
        .setLabel('• MALE')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select_female')
        .setLabel('• FEMALE')
        .setStyle(ButtonStyle.Danger)
    );

    const targetChannel = await interaction.guild.channels.fetch(TARGET_CHANNEL);
    if (!targetChannel) return interaction.reply({ content: 'Target channel not found.', ephemeral: true });

    await targetChannel.send({ embeds: [embed], components: [buttons] });

    await interaction.reply({ content: 'Gender role message posted!', ephemeral: true });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (interaction.customId === 'select_male') {
    await member.roles.remove(FEMALE_ROLE).catch(() => {});
    await member.roles.add(MALE_ROLE).catch(() => {});
    return interaction.reply({ content: 'You have selected **MALE**.', ephemeral: true });
  }

  if (interaction.customId === 'select_female') {
    await member.roles.remove(MALE_ROLE).catch(() => {});
    await member.roles.add(FEMALE_ROLE).catch(() => {});
    return interaction.reply({ content: 'You have selected **FEMALE**.', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
