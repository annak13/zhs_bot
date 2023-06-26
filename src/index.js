require("dotenv").config();
const fs = require("fs");
const { getAvailableCourts, getLastDay } = require("./zhs_data_viewer/ZHSDestroyer.js");

const { Client, Collection } = require("discord.js");

const client = new Client({ intents: [] });

client.on("ready", async () => {
  var waitMillseconds = 5 * 60000;
  let arrCourts = [];
  let arrTempCourts = [];
  let intIntervalLoop = 0;
  let dateLast = await getLastDay();
  let dateLastTemp = await getLastDay();
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  setInterval(async function () {
    arrCourts = await getAvailableCourts();
    let arrAnswer;
    if (arrCourts && arrCourts.length > 0) {
      arrAnswer = getStrView(findDifferences(arrCourts, arrTempCourts));
      arrTempCourts = arrCourts;
    }
    let currentDate = new Date().toLocaleString();
    intIntervalLoop++;
    console.log('Interval Nr.: ' + intIntervalLoop + ', Date: ' + currentDate);
   
    dateLast = await getLastDay();
    if (dateLast.getTime() <= dateLastTemp.getTime()) {
      if (Array.isArray(arrAnswer) && arrAnswer.length && intIntervalLoop > 1 ) {
        for (let i = 0; i < arrAnswer.length; i++) {
          const answer = arrAnswer[i];
          channel.send(answer);
        }
      }
    } else {
      dateLastTemp = await getLastDay();
      channel.send('A new day is available for booking!');
    }
  }, waitMillseconds);
});

client.commands = new Collection();

/*const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));
// console.log(commandFiles);

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`);
  client.commands.set(command.data.name, command);
  console.log(commandFile);
  console.log("nd of commands");
});*/

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
