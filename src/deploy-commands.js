require("dotenv").config()
const { Client, GatewayIntentBits } = require('discord.js')
const fs = require("fs")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")

const commands = []

const commandFiles = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js"))


commandFiles.forEach(commandFile => {
    const command = require(`./commands/${commandFile}`)
    commands.push(command.data.toJSON())

})

const restClient = new REST({version: "9"}).setToken(process.env.TOKEN)

restClient.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
{body: commands})
.then(() => console.log("successfully registered commands"))
.catch(() => console.log("error registering commands"))
