require("dotenv").config()
const { Client, GatewayIntentBits } = require('discord.js')


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
	console.log('Ready!');
	console.log(`Ready. logged in as ${client.user.tag}. I am on ${client.guilds.cache.size} guild(s)`)
	client.user.setActivity({name: 'mit dem Code', type: 'Playing'})
});

// client.on('interactionCreate', async interaction => {
// 	console.log(interaction);
// 	if (!interaction.isChatInputCommand()) return;

// 	const { commandName } = interaction;

// 	if (commandName === 'ping') {
// 		await interaction.reply('Pong!');
// 	} else if (commandName === 'server') {
// 		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
// 	} else if (commandName === 'user') {
// 		await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
// 	}
// });

client.login(process.env.TOKEN);
