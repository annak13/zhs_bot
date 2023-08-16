require("dotenv").config();
const fs = require("fs");
const { getAvailableCourts, getLastDay, crossoutBookedCourts, revcrossoutAvailableCourts } = require("./zhs_data_viewer/ZHSDestroyer.js");

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
    try {
    arrCourts = await getAvailableCourts();
    let arrAnswer;
    let arrBooked;
    if (arrCourts && arrCourts.length > 0) {
      arrAnswer = getNewCourts(arrCourts, arrTempCourts);
      await revcrossoutAvailableCourts(30, channel, arrCourts);
      arrAnswer = getStrView(getNewCourts(arrCourts, arrTempCourts));
      arrBooked = getBookedCourts(arrCourts, arrTempCourts);
      await crossoutBookedCourts(30, channel, arrBooked);
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
          //console.log(answer);
          channel.send(answer);
        }
      }
    } else {
      dateLastTemp = await getLastDay();
      //console.log('A new day is available for booking!');
      channel.send('A new day is available for booking!');
    }
  }
  catch (error) {
    console.log('Error ' + error + ' was thrown at ' + new Date().toLocaleString());
  }}
  , waitMillseconds);
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

function getNewCourts(arrFst, arrSnd) {
  return arrFst.filter((x) => !arrSnd.includes(x));
}

function getBookedCourts(arrFst, arrSnd) {
  return arrSnd.filter((x) => !arrFst.includes(x));
}
