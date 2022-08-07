
// const fetch  = require("node-fetch");
const { JSDOM } = require("jsdom");
//  import { JSDOM } from "jsdom";

import fetch from "node-fetch";



  
async function getDocuments(arrURLs) {
  let arrDocs = [];
  for (let i = 0; i < arrURLs.length; i++) {
    const strURL = arrURLs[i];
    let doc = await getDocumentFromURL(strURL);
    arrDocs.push(doc);
  }
  return arrDocs;
}

async function getDocumentFromURL(strURL) {
  let jsonResponse = await fetch(strURL);
  let strHTML = await jsonResponse.text();
  let doc = new JSDOM(strHTML);
  return doc;
}

function getTables(arrDocs) {
  let arrArrTables = [];
  arrDocs.forEach(function (doc) {
    let arrTables = doc.window.document.getElementsByClassName("areaPeriods");
    arrArrTables.push(arrTables);
  });
  return arrArrTables;
}

function getDictTables(arrArrTables) {
  let arrDictTables = [];
  for (let i = 0; i < arrArrTables.length; i++) {
    let arrTables = arrArrTables[i];
    for (let i = 0; i < arrTables.length; i++) {
      let dictTable = {
        Court: "",
        Times: [],
      };
      let arrElemInfo = [];
      let table = arrTables[i];
      dictTable.Court =
        table.firstElementChild.firstElementChild.firstElementChild.innerHTML;
      let arrElems = table.firstElementChild.getElementsByTagName("td");
      for (let i = 0; i < arrElems.length; i++) {
        let elem = arrElems[i];
        let dictTimes = {
          State: "",
          Timeslot: "",
        };
        dictTimes.State = elem.className;
        if (elem.className.startsWith("avaliable")) {
          dictTimes.Timeslot = elem.firstElementChild.innerHTML;
        } else if (
          elem.className != "ordered" &&
          elem.className != "unAvaliable"
        ) {
          dictTimes.Timeslot = elem.innerHTML.split("<")[0];
        } else {
          dictTimes.Timeslot = elem.innerHTML;
        }
        arrElemInfo.push(dictTimes);
      }

      dictTable.Times = arrElemInfo;
      arrDictTables.push(dictTable);
    }
  }
  return arrDictTables;
}

function CheckForAvailableCourts(
  arrDictCourtDays,
  optionFromHour = 0,
  optionFromMinute = 0,
  optionToHour = 23,
  optionToMinute = 59
) {
  let arrDictAvailableCourts = [];
  arrDictCourtDays.forEach(function (dictCourtDay) {
    let dayTemp = dictCourtDay.Day;
    dictCourtDay.Courts.forEach(function (dictCourts) {
      for (let i = 0; i < dictCourts.Times.length - 1; i++) {
        const dictTimes = dictCourts.Times[i];
        const dictTimesAfter = dictCourts.Times[i + 1];
        if (
          dictTimes.State.startsWith("avaliable") &&
          dictTimesAfter.State.startsWith("avaliable") &&
          dictTimes.Timeslot.From >=
            dayTemp.setHours(optionFromHour, optionFromMinute) &&
          dictTimes.Timeslot.To <=
            dayTemp.setHours(optionToHour, optionToMinute)
        ) {
          let dictAvailableCourt = {
            Day: new Date(),
            Court: "",
            Timeslot: {
              From: new Date(),
              To: new Date(),
            },
          };
          dictAvailableCourt.Day = dayTemp;
          dictAvailableCourt.Court = dictCourts.Court;
          dictAvailableCourt.Timeslot.From = dictTimes.Timeslot.From;
          dictAvailableCourt.Timeslot.To = dictTimesAfter.Timeslot.To;
          arrDictAvailableCourts.push(dictAvailableCourt);
          dictAvailableCourt = {};
        }
        i++;
      }
    });
  });
  return arrDictAvailableCourts;
}

function getArrayOfDays(optionDays) {
  let arrDates = [];
  for (let i = 0; i < 9; i++) {
    var date = new Date();
    date.setDate(date.getDate() + i);
    let dayInWeek = date.getDay();
    if (optionDays.includes(dayInWeek)) {
      var numDay = String(date.getDate()).padStart(2, "0");
      var numMonth = String(date.getMonth() + 1).padStart(2, "0");
      var numYear = date.getFullYear();
      var strDate = numYear + "-" + numMonth + "-" + numDay;
      arrDates.push(strDate);
    }
  }
  return arrDates;
}

function getURLs(arrDates) {
  let arrPages = [2, 3, 4];
  let arrDictURLsDays = [];
  arrDates.forEach(function (date) {
    let arrURLs = [];
    let dictCourts = {
      Day: date,
      Courts: [],
    };
    arrPages.forEach(function (pageNumber) {
      var strURL =
        "https://ssl.forumedia.eu/zhs-courtbuchung.de/reservations.php?action=showReservations&type_id=1&date=" +
        date +
        "&page=" +
        pageNumber;
      arrURLs.push(strURL);
    });
    dictCourts.Courts = arrURLs;
    arrDictURLsDays.push(dictCourts);
  });
  return arrDictURLsDays;
}



module.exports = {
  async  getAvailableCourts(
    optionDays = [0, 1, 2, 3, 4, 5, 6],
    optionFromHour = 0,
    optionFromMinute = 0,
    optionToHour = 23,
    optionToMinute = 59
  ) {
  let arrDates = getArrayOfDays(optionDays);
  let arrDictURLsDays = getURLs(arrDates);

  for (let i = 0; i < arrDictURLsDays.length; i++) {
    const dictCourts = arrDictURLsDays[i];
    let arrDocs = await getDocuments(dictCourts.Courts);
    let arrArrTables = getTables(arrDocs);
    let arrDictTables = getDictTables(arrArrTables);
    dictCourts.Courts = arrDictTables;
  }

  arrDictURLsDays.forEach((dictCourts) => {
    let tempDay = new Date(new Date(dictCourts.Day).setHours(0, 0, 0, 0));
    dictCourts.Day = new Date(new Date(dictCourts.Day).setHours(0, 0, 0, 0));
    dictCourts.Courts.forEach((dictCourts) => {
      dictCourts.Times.forEach((Time) => {
        let dictTimeslot = {
          From: new Date(),
          To: new Date(),
        };
        let hoursFrom = parseInt(Time.Timeslot.split(" - ")[0].split(":")[0]);
        let minutesFrom = parseInt(Time.Timeslot.split(" - ")[0].split(":")[1]);
        let hoursTo = parseInt(Time.Timeslot.split(" - ")[1].split(":")[0]);
        let minutesTo = parseInt(Time.Timeslot.split(" - ")[1].split(":")[1]);
        dictTimeslot.From = new Date(
          new Date(tempDay).setHours(hoursFrom, minutesFrom, 0, 0)
        );
        dictTimeslot.To = new Date(
          new Date(tempDay).setHours(hoursTo, minutesTo, 0, 0)
        );
        Time.Timeslot = dictTimeslot;
      });
    });
  });
  return CheckForAvailableCourts(
    arrDictURLsDays,
    optionFromHour,
    optionFromMinute,
    optionToHour,
    optionToMinute
  );
}


}