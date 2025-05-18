const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Deletes the latest 15 messages from the mentioned user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to delete messages from')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const channel = interaction.channel;

    if (!channel || !channel.messages) {
      return interaction.reply({ content: 'Unable to access messages in this channel.', ephemeral: true });
    }

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const toDelete = messages.filter(m => m.author.id === targetUser.id).first(15);

      for (const msg of toDelete) {
        await msg.delete();
      }

      await interaction.reply(`Deleted ${toDelete.length} messages from ${targetUser.tag}.`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to delete some messages.', ephemeral: true });
    }
  }
};
