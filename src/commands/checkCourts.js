//Wir importieren SlashCommandBuilder von Discordjs Builders, um damit einfach Slash Commands zu erstellen
const {
  ActionRowBuilder,
  SelectMenuBuilder,
  SlashCommandBuilder,
} = require("@discordjs/builders");

// import { getAvailableCourts } from "./zhs_data_viewer/ZHSDestroyer.js";

const { getAvailableCourts } = require("../zhs_data_viewer/ZHSDestroyer.js");

//Wir exportieren in unserem File, den Command mit module.exports
module.exports = {
  //Wir erstellen den Slash Command
  data: new SlashCommandBuilder()
    .setName("checkcourts")
    .setDescription("All available slots!"),
  //Das ist unsere Methode, wo wir unsere Interaction abfangen, diese ist async
  async execute(interaction) {
    //Mit Pong antworten

    const arrAnswer = await getAvailableCourts([0, 1, 2, 3, 4, 5, 6]);
    if ((Array.isArray(arrAnswer) && !arrAnswer.length) || arrAnswer[0] == "") {
      await interaction.reply("No courts available");
    } else {
      await interaction.reply(arrAnswer[0]);
      for (let i = 1; i < arrAnswer.length; i++) {
        const answer = arrAnswer[i];
        await interaction.followUp(answer);
      }
    }

    /*Andere Optionen, zu Antworten 
			interaction.reply({content: "Pong!"});
		    interaction.reply({content: "Pong!", embeds: []});
			interaction.reply({content: "Pong!", ephemeral: true});
			interaction.editReply({content: "Pong!"});

			Video: Zeigen wie man zu den Types kommt und da mithilfe von STRG+F die richtigen Methoden/Properties/Payloads findet
		*/
  },
};
