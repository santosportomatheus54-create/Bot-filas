const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
PermissionsBitField,
SlashCommandBuilder
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

client.once("ready", () =>{
console.log(`Bot online: ${client.user.tag}`)
})

/* INTERAÇÕES */

client.on("interactionCreate", async interaction =>{

/* COMANDO /FILA */

if(interaction.isChatInputCommand()){

if(interaction.commandName === "fila"){

const embed = new EmbedBuilder()
.setTitle("🎮 Escolha o modo")
.setDescription("Selecione o modo da partida")
.setColor("Blue")

const row = new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId("modo_1v1")
.setLabel("1v1")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("modo_2v2")
.setLabel("2v2")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("modo_3v3")
.setLabel("3v3")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("modo_4v4")
.setLabel("4v4")
.setStyle(ButtonStyle.Primary)

)

interaction.reply({embeds:[embed],components:[row]})

}

/* SETAR VENCEDOR */

if(interaction.commandName === "vencedor"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({content:"Apenas ADM",ephemeral:true})

const user = interaction.options.getUser("player")
const valor = interaction.options.getInteger("valor")

if(!carteiras[user.id]) carteiras[user.id] = 0

carteiras[user.id] += valor

interaction.reply(`🏆 ${user} recebeu **${valor}** moedas`)
}

}

/* BOTÕES */

if(interaction.isButton()){

const user = interaction.user

/* ESCOLHER MODO */

if(interaction.customId.startsWith("modo_")){

const modo = interaction.customId.split("_")[1]

interaction.reply(`Modo escolhido: **${modo}**`)

let delay = 0

for(const valor of valores){

setTimeout(()=>{

criarFila(interaction.channel,valor,modo)

},delay)

delay += 2000

}

}

/* ENTRAR FILA */

if(interaction.customId.startsWith("entrar")){

if(jogadoresFila.has(user.id))
return interaction.reply({content:"Você já está em uma fila",ephemeral:true})

const id = interaction.customId.split("_")[1]

filas[id].push(user.id)

jogadoresFila.set(user.id,id)

interaction.reply({content:"Entrou na fila",ephemeral:true})

if(filas[id].length === 2){

criarSala(interaction.guild,id)

}

}

/* SAIR FILA */

if(interaction.customId.startsWith("sair")){

if(!jogadoresFila.has(user.id))
return interaction.reply({content:"Você não está em fila",ephemeral:true})

const id = jogadoresFila.get(user.id)

filas[id] = filas[id].filter(x => x !== user.id)

jogadoresFila.delete(user.id)

interaction.reply({content:"Saiu da fila",ephemeral:true})

}

/* ASSUMIR PARTIDA */

if(interaction.customId === "assumir_partida"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({content:"Apenas ADM pode assumir",ephemeral:true})

interaction.reply("✅ Partida assumida pelo ADM")

}

}

})

/* CRIAR FILA */

async function criarFila(channel,valor,modo){

const id = `${modo}_${valor}`

filas[id] = []

const embed = new EmbedBuilder()
.setTitle(`💰 Fila ${modo} | ${valor}`)
.setDescription(`Jogadores: **0/2**`)
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

/* CRIAR SALA DA PARTIDA */

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
.setTitle("⚔️ Partida criada")
.setDescription("Aguardando um ADM assumir a partida")
.setColor("Red")

const row = new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId("assumir_partida")
.setLabel("ASSUMIR PARTIDA")
.setStyle(ButtonStyle.Success)

)

canal.send({embeds:[embed],components:[row]})

}

/* COMANDO SACAR */

client.on("messageCreate", message =>{

if(message.content === "!sacar"){

const saldo = carteiras[message.author.id] || 0

const embed = new EmbedBuilder()
.setTitle("💰 Carteira")
.setDescription(`Seu saldo: **${saldo} moedas**`)
.setColor("Yellow")

message.reply({embeds:[embed]})

}

})

client.login(process.env.TOKEN)
