require("dotenv").config();
const fs = require("fs");
const { getAvailableCourts } = require("./zhs_data_viewer/ZHSDestroyer.js");

const { Client, Collection } = require("discord.js");

const client = new Client({ intents: [] });

client.on("ready", async () => {
  var waitMillseconds = 1.5 * 60000;
  let arrCourts = [];
  let arrTempCourts = [];
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  setInterval(async function () {
    arrCourts = await getAvailableCourts();
    let arrAnswer = getStrView(findDifferences(arrCourts, arrTempCourts));
    console.log(arrCourts);
    console.log(arrAnswer);
    console.log(arrTempCourts);
    console.log();
    arrTempCourts = arrCourts;
    if (Array.isArray(arrAnswer) && arrAnswer.length) {
      for (let i = 0; i < arrAnswer.length; i++) {
        const answer = arrAnswer[i];
        channel.send(answer);
      }
    }
  }, waitMillseconds);
});

client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));
console.log("tt");
console.log(commandFiles);

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`);
  client.commands.set(command.data.name, command);
  console.log(commandFile);
  console.log("nd of commands");
});

client.once("ready", () => {
  console.log("Ready!");
  console.log(
    `Ready. logged in as ${client.user.tag}. I am on ${client.guilds.cache.size} guild(s)`
  );
  client.user.setActivity({ name: "mit dem Code", type: "Playing" });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.log(error);

      if (interaction.deferred || interaction.replied) {
        interaction.editReply("Error when executing command");
      } else {
        interaction.reply("Error when executing command");
      }
    }
  }
});

client.login(process.env.TOKEN);

function getStrView(arrAnswer) {
  let arrStrView = [];
  let strView = "";
  for (let i = 0; i < arrAnswer.length; i++) {
    if (strView.length >= 1900) {
      arrStrView.push(strView);
      strView = "";
      i--;
    } else {
      strView = strView + arrAnswer[i] + "\n";
    }
    if (i === arrAnswer.length - 1) {
      arrStrView.push(strView);
    }
  }
  return arrStrView;
}

function findDifferences(arrFst, arrSnd) {
  return arrFst.filter((x) => !arrSnd.includes(x));
}
