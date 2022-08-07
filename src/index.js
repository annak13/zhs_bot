require("dotenv").config()
const fs = require("fs")

const { Client, Collection } = require('discord.js')


const client = new Client({ intents: [] });

client.commands = new Collection()

const commandFiles = fs.readdirSync("./src/commands").filter(file => file.endsWith(". cjs"))
console.log("tt")
console.log(commandFiles)

commandFiles.forEach(commandFile => {
    const command = require(`./commands/${commandFile}`)
    client.commands.set(command.data.name, command)
	console.log(commandFile)
	console.log("nd of commands")
})

client.once('ready', () => {
	console.log('Ready!');
	console.log(`Ready. logged in as ${client.user.tag}. I am on ${client.guilds.cache.size} guild(s)`)
	client.user.setActivity({name: 'mit dem Code', type: 'Playing'})
});


client.on("interactionCreate", async (interaction) => {
	if(!interaction.isCommand()) return

	const command = client.commands.get(interaction.commandName)

	if(command) {
		try {
			await command.execute(interaction)
		} catch(error){
			console.log(error)

			if(interaction.deferred || interaction.replied) {
				interaction.editReply("Error when executing command")
			} else {
				interaction.reply("Error when executing command")
			}
		}
	}

})

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
