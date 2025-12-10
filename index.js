const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  EmbedBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// -------------------------------------------------
// 🔧 CONFIG À MODIFIER
// -------------------------------------------------
const TOKEN = "";
const CHANNEL_ID = "1447993420353241369";
const CATEGORY_ID = "1433808836321349713";
const ROLE_TO_PING = "1442973069365870702";
const LOGS_CHANNEL = "1448241758260695130"; // Salon privé de logs

// -------------------------------------------------
// 📌 IMAGE ANIME
// -------------------------------------------------
const ANIME_IMG =
  "https://i.pinimg.com/originals/3e/6f/44/3e6f44bc98c4376b63a64a6b740249b5.jpg";

// -------------------------------------------------
// 📩 ENVOI MESSAGE "Créer un Ticket"
// -------------------------------------------------
client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle("🎫 Création de Ticket")
    .setDescription("Clique sur le bouton ci-dessous pour ouvrir un ticket.")
    .setColor("#00FFFF")
    .setImage(ANIME_IMG);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start_ticket")
      .setLabel("Créer un Ticket")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

// -------------------------------------------------
// 🎛️ CHOIX TYPE DE TICKET
// -------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "start_ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Choisis ton type de ticket")
      .setDescription("Sélectionne ton besoin ci-dessous :")
      .setColor("#00FF00")
      .setImage(ANIME_IMG);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("staff")
        .setLabel("Contacter Staff")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("giveaway")
        .setLabel("Créer Giveaway")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("claim")
        .setLabel("Claim Giveaway")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("partenariat")
        .setLabel("Partenariat")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  // -------------------------------------------------
  // 🎟️ CRÉATION DU TICKET
  // -------------------------------------------------
  const ticketTypes = {
    staff: "Contacter le Staff",
    giveaway: "Créer un Giveaway",
    claim: "Claim un Giveaway",
    partenariat: "Partenariat",
  };

  if (Object.keys(ticketTypes).includes(interaction.customId)) {
    const guild = interaction.guild;
    const member = interaction.user;
    const type = ticketTypes[interaction.customId];

    const channelName = `ticket-${member.username}`
      .toLowerCase()
      .replace(/ /g, "-");

    if (guild.channels.cache.find((c) => c.name === channelName))
      return interaction.reply({
        content: "❌ Tu as déjà un ticket ouvert.",
        ephemeral: true,
      });

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ["ViewChannel"] },
        {
          id: member.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
        {
          id: ROLE_TO_PING,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
      ],
    });

    // -------------------------------------------------
    // 📜 LOG — TICKET OUVERT
    // -------------------------------------------------
    const logs = await guild.channels.fetch(LOGS_CHANNEL);
    const logOpen = new EmbedBuilder()
      .setTitle("🟢 Ticket Ouvert")
      .addFields(
        { name: "Utilisateur :", value: `${member}` },
        { name: "Type :", value: type },
        { name: "Salon :", value: `${ticketChannel}` }
      )
      .setColor("#00FF00")
      .setThumbnail(member.displayAvatarURL())
      .setImage(ANIME_IMG);

    logs.send({ embeds: [logOpen] });

    // -------------------------------------------------
    // MESSAGE DANS LE TICKET
    // -------------------------------------------------
    const embed = new EmbedBuilder()
      .setTitle("🎟️ Ticket Ouvert")
      .setDescription(
        `Bonjour ${member}, un membre du staff arrivera bientôt.\n\nType : **${type}**`
      )
      .setColor("#FF00AA")
      .setImage(ANIME_IMG);

    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Fermer le Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send(`<@&${ROLE_TO_PING}>`);
    await ticketChannel.send({ embeds: [embed], components: [closeButton] });

    return interaction.reply({
      content: `🎫 Ticket créé : ${ticketChannel}`,
      ephemeral: true,
    });
  }

  // -------------------------------------------------
  // ❌ FERMETURE DU TICKET
  // -------------------------------------------------
  if (interaction.customId === "close_ticket") {
    const logs = await interaction.guild.channels.fetch(LOGS_CHANNEL);
    const member = interaction.user;

    // LOG DE FERMETURE
    const logClose = new EmbedBuilder()
      .setTitle("🔴 Ticket Fermé")
      .addFields(
        { name: "Fermé par :", value: `${member}` },
        { name: "Salon :", value: `${interaction.channel.name}` }
      )
      .setColor("#FF0000")
      .setThumbnail(member.displayAvatarURL())
      .setImage(ANIME_IMG);

    logs.send({ embeds: [logClose] });

    await interaction.reply({
      content: "⏳ Fermeture dans 3 secondes...",
      ephemeral: true,
    });

    setTimeout(() => {
      interaction.channel.delete();
    }, 3000);
  }
});

client.login(TOKEN);
