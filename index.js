const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const valores = [100, 50, 20, 10, 5, 2, 1];

const filas = {};
const ranking = {};
const saldo = {};

valores.forEach(v => {
  filas[v] = {
    normal: [],
    inf: [],
    full: [],
    message: null
  };
});

client.once("ready", async () => {
  console.log(`🔥 Online como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("fila")
      .setDescription("Criar todas as filas automáticas")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
});

client.on("interactionCreate", async interaction => {

  // COMANDO /fila
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "fila") {

      await interaction.reply({
        content: "🔥 Criando filas...",
        ephemeral: true
      });

      for (let valor of valores) {
        await criarFila(interaction.channel, valor);
        await delay(2000);
      }
    }
  }

  // BOTÕES
  if (interaction.isButton()) {

    const [tipo, valor] = interaction.customId.split("_");
    const userId = interaction.user.id;
    const fila = filas[valor];

    if (!fila) return;

    // SAIR
    if (tipo === "sair") {

      fila.normal = fila.normal.filter(id => id !== userId);
      fila.inf = fila.inf.filter(id => id !== userId);
      fila.full = fila.full.filter(id => id !== userId);

      await atualizarEmbed(valor);
      return interaction.reply({ content: "🚪 Você saiu da fila!", ephemeral: true });
    }

    // ENTRAR
    if (!fila[tipo].includes(userId)) {
      fila[tipo].push(userId);
    }

    await interaction.reply({ content: "✅ Você entrou na fila!", ephemeral: true });

    if (fila[tipo].length === 2) {
      await criarPartida(interaction.guild, fila[tipo], valor, tipo);
      fila[tipo] = [];
    }

    await atualizarEmbed(valor);
  }
});

async function criarFila(channel, valor) {

  const embed = new EmbedBuilder()
    .setTitle(`💰 Fila ${valor}`)
    .setColor("#ff6600")
    .addFields(
      { name: "🧊 Gel Normal", value: listar(filas[valor].normal) },
      { name: "❄️ Gel Infinito", value: listar(filas[valor].inf) },
      { name: "🎯 Full Capa", value: listar(filas[valor].full) }
    )
    .setFooter({ text: "Sistema automático de filas" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`normal_${valor}`)
      .setLabel("🧊 Gel Normal")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`inf_${valor}`)
      .setLabel("❄️ Gel Inf")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`full_${valor}`)
      .setLabel("🎯 Full Capa")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`sair_${valor}`)
      .setLabel("🚪 Sair")
      .setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({
    embeds: [embed],
    components: [row]
  });

  filas[valor].message = msg;
}

function listar(array) {
  if (array.length === 0) return "Nenhum jogador.";
  return array.map(id => `<@${id}>`).join("\n");
}

async function atualizarEmbed(valor) {

  const fila = filas[valor];
  if (!fila.message) return;

  const embed = new EmbedBuilder()
    .setTitle(`💰 Fila ${valor}`)
    .setColor("#ff6600")
    .addFields(
      { name: "🧊 Gel Normal", value: listar(fila.normal) },
      { name: "❄️ Gel Infinito", value: listar(fila.inf) },
      { name: "🎯 Full Capa", value: listar(fila.full) }
    )
    .setFooter({ text: "Atualização automática" });

  await fila.message.edit({ embeds: [embed] });
}

async function criarPartida(guild, players, valor, tipo) {

  const canal = await guild.channels.create({
    name: `x1-${valor}-${tipo}`,
    type: ChannelType.GuildText,
    parent: process.env.CATEGORY_ID,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      ...players.map(id => ({
        id: id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }))
    ]
  });

  canal.send(`🔥 Partida criada!\n\nValor: ${valor}\nModo: ${tipo}\n\nJogadores:\n${players.map(id => `<@${id}>`).join("\n")}`);

  if (process.env.LOG_CHANNEL_ID) {
    const log = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (log) {
      log.send(`📢 Nova partida criada - ${valor} (${tipo})`);
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);
