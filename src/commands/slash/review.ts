import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalSubmitInteraction,
  AttachmentBuilder,
} from 'discord.js';
import prisma from '../../lib/prisma';

const CATEGORIES = ['Movies', 'Music', 'Food', 'Experience', 'Game', 'Book', 'Other'];

const CATEGORY_COLORS: Record<string, number> = {
  Movies: 0xe74c3c,
  Music: 0x9b59b6,
  Food: 0xe67e22,
  Experience: 0x2ecc71,
  Game: 0x3498db,
  Book: 0xf1c40f,
  Other: 0x95a5a6,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Review anything')
    .addSubcommand((sub) =>
      sub.setName('create').setDescription('Write a new review')
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View a review')
        .addIntegerOption((opt) =>
          opt.setName('id').setDescription('Review ID').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Browse reviews')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('Filter by user').setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('category')
            .setDescription('Filter by category')
            .setRequired(false)
            .addChoices(...CATEGORIES.map((c) => ({ name: c, value: c })))
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete your review')
        .addIntegerOption((opt) =>
          opt.setName('id').setDescription('Review ID').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('search')
        .setDescription('Search reviews by subject')
        .addStringOption((opt) =>
          opt.setName('query').setDescription('Search term').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') await handleCreate(interaction);
    else if (sub === 'view') await handleView(interaction);
    else if (sub === 'list') await handleList(interaction);
    else if (sub === 'delete') await handleDelete(interaction);
    else if (sub === 'search') await handleSearch(interaction);
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction) {
  // Step 1: category select
  const select = new StringSelectMenuBuilder()
    .setCustomId('review_category')
    .setPlaceholder('Select a category')
    .addOptions(
      CATEGORIES.map((c) =>
        new StringSelectMenuOptionBuilder().setLabel(c).setValue(c)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: 'What category is your review?',
    components: [row],
    ephemeral: true,
  });

  const categoryResponse = await interaction
    .channel!.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'review_category',
      time: 60_000,
    })
    .catch(() => null);

  if (!categoryResponse) {
    await interaction.editReply({ content: 'Timed out.', components: [] });
    return;
  }

  const category = categoryResponse.values[0];

  // Step 2: modal for review details
  const modal = new ModalBuilder()
    .setCustomId('review_modal')
    .setTitle(`New ${category} Review`);

  const subjectInput = new TextInputBuilder()
    .setCustomId('subject')
    .setLabel('What are you reviewing?')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const ratingInput = new TextInputBuilder()
    .setCustomId('rating')
    .setLabel('Your rating (e.g. 8/10, S+, 50/10)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(20)
    .setRequired(true);

  const commentsInput = new TextInputBuilder()
    .setCustomId('comments')
    .setLabel('Your thoughts (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1000)
    .setRequired(false);

  const imageUrlInput = new TextInputBuilder()
    .setCustomId('imageUrl')
    .setLabel('Image URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(500)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(subjectInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(ratingInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(commentsInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(imageUrlInput)
  );

  await categoryResponse.showModal(modal);

  const modalSubmit: ModalSubmitInteraction | null = await categoryResponse
    .awaitModalSubmit({ time: 300_000, filter: (i) => i.user.id === interaction.user.id })
    .catch(() => null);

  if (!modalSubmit) {
    await interaction.editReply({ content: 'Timed out.', components: [] });
    return;
  }

  const subject = modalSubmit.fields.getTextInputValue('subject');
  const rating = modalSubmit.fields.getTextInputValue('rating').trim();
  const comments = modalSubmit.fields.getTextInputValue('comments').trim() || null;
  const imageUrlRaw = modalSubmit.fields.getTextInputValue('imageUrl').trim();
  const imageUrlFromModal = imageUrlRaw && isValidUrl(imageUrlRaw) ? imageUrlRaw : null;

  await modalSubmit.deferReply({ ephemeral: true });

  // Ask for image file upload
  const skipButton = new ButtonBuilder()
    .setCustomId('skip_image')
    .setLabel('Skip')
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton);

  await modalSubmit.editReply({
    content: 'Upload an image for your review (attach a file to your next message), or click **Skip**.',
    components: [buttonRow],
  });

  let imageUrl: string | null = imageUrlFromModal;
  let imageBuffer: Buffer | null = null;
  let imageFileName = 'image.png';

  if (!imageUrl) {
    const result = await Promise.race([
      interaction.channel!.awaitMessages({
        filter: (m) => m.author.id === interaction.user.id && m.attachments.size > 0,
        max: 1,
        time: 60_000,
      }).then((coll) => ({ type: 'message' as const, data: coll.first() })).catch(() => null),
      interaction.channel!.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id && i.customId === 'skip_image',
        time: 60_000,
      }).then((btn) => ({ type: 'skip' as const, data: btn })).catch(() => null),
    ]);

    if (result?.type === 'message' && result.data) {
      const attachment = result.data.attachments.first();
      if (attachment?.contentType?.startsWith('image/')) {
        const res = await fetch(attachment.url);
        imageBuffer = Buffer.from(await res.arrayBuffer());
        imageFileName = attachment.name ?? 'image.png';
      }
      await result.data.delete().catch(() => null);
    } else if (result?.type === 'skip') {
      await result.data.update({ content: 'Skipped.', components: [] });
    }
  }

  await modalSubmit.editReply({ content: 'Saving review...', components: [] });

  // Save to DB (imageUrl may be updated below after re-upload)
  const review = await prisma.review.create({
    data: {
      subject,
      category,
      rating,
      imageUrl,
      comments,
      authorId: interaction.user.id,
      guildId: interaction.guildId!,
    },
  });

  const embed = buildReviewEmbed(review, interaction.user.username, interaction.user.displayAvatarURL());

  if (imageBuffer) {
    const file = new AttachmentBuilder(imageBuffer, { name: imageFileName });
    embed.setImage(`attachment://${imageFileName}`);
    const sent = await interaction.channel!.send({ embeds: [embed], files: [file] });
    const cdnUrl = sent.attachments.first()?.url;
    if (cdnUrl) await prisma.review.update({ where: { id: review.id }, data: { imageUrl: cdnUrl } });
  } else {
    await interaction.channel!.send({ embeds: [embed] });
  }

  await modalSubmit.editReply({ content: `Review #${review.id} created!`, embeds: [], components: [] });
}

async function handleView(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getInteger('id', true);
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) {
    await interaction.reply({ content: `No review found with ID \`${id}\`.`, ephemeral: true });
    return;
  }

  const member = await interaction.guild?.members.fetch(review.authorId).catch(() => null);
  const username = member?.user.username ?? 'Unknown';
  const avatar = member?.user.displayAvatarURL() ?? undefined;

  await interaction.reply({ embeds: [buildReviewEmbed(review, username, avatar)] });
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user');
  const category = interaction.options.getString('category');

  const reviews = await prisma.review.findMany({
    where: {
      guildId: interaction.guildId!,
      ...(user && { authorId: user.id }),
      ...(category && { category }),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (!reviews.length) {
    await interaction.reply({ content: 'No reviews found.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Reviews')
    .setColor(0x5865f2)
    .setDescription(
      reviews
        .map((r) => `**#${r.id}** • ${r.subject} • ${r.category} • ${'⭐'.repeat(r.rating)} (${r.rating}/10)`)
        .join('\n')
    )
    .setFooter({ text: `Showing ${reviews.length} most recent` });

  await interaction.reply({ embeds: [embed] });
}

async function handleDelete(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getInteger('id', true);
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) {
    await interaction.reply({ content: `No review found with ID \`${id}\`.`, ephemeral: true });
    return;
  }

  if (review.authorId !== interaction.user.id) {
    await interaction.reply({ content: 'Can only delete your own reviews.', ephemeral: true });
    return;
  }

  await prisma.review.delete({ where: { id } });
  await interaction.reply({ content: `Review #${id} deleted.`, ephemeral: true });
}

async function handleSearch(interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString('query', true);

  const reviews = await prisma.review.findMany({
    where: {
      guildId: interaction.guildId!,
      subject: { contains: query },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (!reviews.length) {
    await interaction.reply({ content: `No reviews found for \`${query}\`.`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Search: "${query}"`)
    .setColor(0x5865f2)
    .setDescription(
      reviews
        .map((r) => `**#${r.id}** • ${r.subject} • ${r.category} • ${'⭐'.repeat(r.rating)} (${r.rating}/10)`)
        .join('\n')
    );

  await interaction.reply({ embeds: [embed] });
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function buildReviewEmbed(
  review: {
    id: number;
    subject: string;
    category: string;
    rating: string;
    imageUrl: string | null;
    comments: string | null;
    createdAt: Date;
  },
  username: string,
  avatarUrl?: string
) {
  const color = CATEGORY_COLORS[review.category] ?? 0x95a5a6;

  const embed = new EmbedBuilder()
    .setTitle(review.subject)
    .setColor(color)
    .addFields(
      { name: 'Category', value: review.category, inline: true },
      { name: 'Rating', value: `**${review.rating}**`, inline: true }
    )
    .setFooter({ text: `Review #${review.id} by ${username}`, iconURL: avatarUrl })
    .setTimestamp(review.createdAt);

  if (review.comments) embed.addFields({ name: 'Thoughts', value: review.comments });
  if (review.imageUrl) embed.setImage(review.imageUrl);

  return embed;
}
