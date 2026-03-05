const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
PermissionsBitField,
SlashCommandBuilder,
REST,
Routes
} = require("discord.js")

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
})

const filas = {}
const jogadoresFila = new Map()
const carteiras = {}

const valores = [100,50,20,10,5,2,1]

/* COMANDOS */

const commands = [

new SlashCommandBuilder()
.setName("filas")
.setDescription("Criar filas")
.addStringOption(option =>
option.setName("modo")
.setDescription("Escolha o modo")
.setRequired(true)
.addChoices(
{name:"1v1",value:"1v1"},
{name:"2v2",value:"2v2"},
{name:"3v3",value:"3v3"},
{name:"4v4",value:"4v4"}
)
),

new SlashCommandBuilder()
.setName("vencedor")
.setDescription("Setar vencedor")
.addUserOption(option =>
option.setName("player")
.setDescription("Vencedor")
.setRequired(true)
)
.addIntegerOption(option =>
option.setName("valor")
.setDescription("Valor da partida")
.setRequired(true)
)

].map(cmd => cmd.toJSON())

/* REGISTRAR */

const rest = new REST({version:"10"}).setToken(process.env.TOKEN)

client.once("ready", async ()=>{

console.log(`Online: ${client.user.tag}`)

await rest.put(
Routes.applicationCommands(client.user.id),
{body:commands}
)

})

/* INTERAÇÕES */

client.on("interactionCreate", async interaction=>{

if(!interaction.isChatInputCommand() && !interaction.isButton()) return

/* COMANDO FILAS */

if(interaction.isChatInputCommand()){

if(interaction.commandName === "filas"){

const modo = interaction.options.getString("modo")

await interaction.reply(`🎮 Criando filas **${modo}**`)

let delay = 0

for(const valor of valores){

setTimeout(()=>{

criarFila(interaction.channel,valor,modo)

},delay)

delay += 2000

}

}

/* VENCEDOR */

if(interaction.commandName === "vencedor"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({content:"Apenas ADM",ephemeral:true})

const user = interaction.options.getUser("player")
const valor = interaction.options.getInteger("valor")

if(!carteiras[user.id]) carteiras[user.id] = 0

carteiras[user.id] += valor

interaction.reply(`🏆 ${user} ganhou **${valor} moedas**`)

}

}

/* BOTÕES */

if(interaction.isButton()){

const user = interaction.user

if(interaction.customId.startsWith("entrar")){

if(jogadoresFila.has(user.id))
return interaction.reply({content:"Você já está em fila",ephemeral:true})

const id = interaction.customId.split("_")[1]

filas[id].push(user.id)

jogadoresFila.set(user.id,id)

interaction.reply({content:"Entrou na fila",ephemeral:true})

if(filas[id].length === 2){

criarSala(interaction.guild,id)

}

}

if(interaction.customId.startsWith("sair")){

if(!jogadoresFila.has(user.id))
return interaction.reply({content:"Você não está em fila",ephemeral:true})

const id = jogadoresFila.get(user.id)

filas[id] = filas[id].filter(x => x !== user.id)

jogadoresFila.delete(user.id)

interaction.reply({content:"Saiu da fila",ephemeral:true})

}

if(interaction.customId === "assumir"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({content:"Apenas ADM",ephemeral:true})

interaction.reply("✅ Partida assumida")

}

}

})

/* CRIAR FILA */

async function criarFila(channel,valor,modo){

const id = `${modo}_${valor}`

filas[id] = []

const embed = new EmbedBuilder()
.setTitle(`💰 Fila ${modo} | ${valor}`)
.setDescription("Jogadores: **0/2**")
.setColor("Green")

const row = new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId(`entrar_${id}`)
.setLabel("🧊 Gelo Normal")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId(`entrar_${id}`)
.setLabel("❄️ Gelo Infinito")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId(`entrar_${id}`)
.setLabel("🎯 Full Capa")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId(`sair_${id}`)
.setLabel("❌ Sair")
.setStyle(ButtonStyle.Danger)

)

channel.send({embeds:[embed],components:[row]})

}

/* CRIAR SALA */

async function criarSala(guild,id){

const jogadores = filas[id]

const canal = await guild.channels.create({
name:`partida-${id}`,
type:0,
permissionOverwrites:[
{
id:guild.roles.everyone,
deny:["ViewChannel"]
},
...jogadores.map(j=>({
id:j,
allow:["ViewChannel"]
}))
]
})

const embed = new EmbedBuilder()
.setTitle("⚔️ PARTIDA CRIADA")
.setDescription("ADM precisa assumir a partida")
.setColor("Red")

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId("assumir")
.setLabel("ASSUMIR PARTIDA")
.setStyle(ButtonStyle.Success)
)

canal.send({embeds:[embed],components:[row]})

}

/* SACAR */

client.on("messageCreate", msg=>{

if(msg.content === "!sacar"){

const saldo = carteiras[msg.author.id] || 0

const embed = new EmbedBuilder()
.setTitle("💰 Carteira")
.setDescription(`Saldo: **${saldo} moedas**`)
.setColor("Yellow")

msg.reply({embeds:[embed]})

}

})

client.login(process.env.TOKEN)
