const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

async function getDocuments(arrURLs) {
  let promiseArrDocs = [];
  for (let i = 0; i < arrURLs.length; i++) {
    const strURL = arrURLs[i];
    promiseArrDocs.push(getDocumentFromURL(strURL));
  }
  let arrDocs = await Promise.all(promiseArrDocs);
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

function generateStringView(arrDictAvailableCourts) {
  let arrView = [];
  arrDictAvailableCourts.forEach(function (dictAvailableCourts) {
    let strDay = String(dictAvailableCourts.Day.getDate()).padStart(2, "0");
    let strCourt = dictAvailableCourts.Court.replace(/\D/gim, "").padStart(
      2,
      "0"
    );
    let strHour = String(dictAvailableCourts.Timeslot.From.getHours()).padStart(
      2,
      "0"
    );
    let strMinute = String(
      dictAvailableCourts.Timeslot.From.getMinutes()
    ).padStart(2, "0");
    arrView.push(strDay + "_" + strCourt + "_" + strHour + strMinute);
  });
  
  return arrView;
}

module.exports = {
  async getAvailableCourts(
    optionDays = [0, 1, 2, 3, 4, 5, 6],
    optionFromHour = 0,
    optionFromMinute = 0,
    optionToHour = 23,
    optionToMinute = 59
  ) {
    let arrDates = getArrayOfDays(optionDays);
    let arrDictURLsDays = getURLs(arrDates);
    let arrRequests = [];
    for (let i = 0; i < arrDictURLsDays.length; i++) {
      const dictCourts = arrDictURLsDays[i];
      arrRequests.push(getDocuments(dictCourts.Courts));
    }
    let arrArrDocs = await Promise.all(arrRequests);

    for (let i = 0; i < arrDictURLsDays.length; i++) {
      const dictCourts = arrDictURLsDays[i];
      let arrArrTables = getTables(arrArrDocs[i]);
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
          let minutesFrom = parseInt(
            Time.Timeslot.split(" - ")[0].split(":")[1]
          );
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
    let arrDictAvailableCourts = CheckForAvailableCourts(
      arrDictURLsDays,
      optionFromHour,
      optionFromMinute,
      optionToHour,
      optionToMinute
    );
    let arrStrDictAvailableCourts = generateStringView(arrDictAvailableCourts);

    return arrStrDictAvailableCourts;
  },
};
