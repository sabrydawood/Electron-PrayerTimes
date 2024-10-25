const { dialog, nativeImage } = require("electron");
const path = require("path");
const Fetcher = require("./FetchClient");
const Config = require("./Config");
const JsonDb = require("./JsonDb");
const Cache = new Map();
const OldDb = new JsonDb("Database");
const NewPrayData = {};
const AllowedToGet = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const ToDayDate = new Date();
const ToDay = `${ToDayDate.getDate()}-${
  ToDayDate.getMonth() + 1
}-${ToDayDate.getFullYear()}`;
const NextDayValue = `${ToDayDate.getDate() + 1}-${
  ToDayDate.getMonth() + 1
}-${ToDayDate.getFullYear()}`;
const Warnings = {};
const Finished = {};
async function FetchPrayerTimes(NextDay = false) {
  const DataBase = OldDb.Get();
  Cache.set("ToDay", ToDay);
  Cache.set("NextDay", NextDayValue);
  const PrayerTimesUrl = `https://api.aladhan.com/v1/timingsByCity/${
    NextDay ? NextDay : ToDay
  }?city=${DataBase.City}&country=${DataBase.Country}&method=${
    DataBase.Method
  }`;
  try {
    const { data } = await Fetcher.Get(PrayerTimesUrl);
    let PrayData = {};
    for (const key in AllowedToGet) {
      const element = AllowedToGet[key];
      Warnings[element] = false;
      Finished[element] = false;
      if (!NextDay) {
        NewPrayData[element] = data.timings[element];
      }
      PrayData[element] = data.timings[element];
    }
    // return DefaultData;
    return PrayData;
  } catch (error) {
    console.log({
      error,
    });
  }
}

function NotifyMessage(
  title = Config.AppName,
  body = "Prayer Times Body",
  detail
) {
  const AppIcon = nativeImage.createFromPath(
    path.join(__dirname, "..", Config.AppIcon)
  );
  //   const Show = Notify({
  //     title,
  //     body,
  //     silent: false,
  //     timeoutType: "default",
  //     icon: appIcon,
  //   });
  //   Show.show();
  dialog.showMessageBox({
    icon: AppIcon,
    type: "info",
    buttons: ["تم"],
    title: title,
    message: body,
    detail: detail,
  });
}
function Init() {
  setTimeout(() => {
    FetchPrayerTimes();
  }, 3000);
}
function ResetAllData() {
  const W = Object.keys(Warnings);
  W.map((item) => {
    Warnings[item] = false;
    Finished[item] = false;
  });
}

module.exports = {
  Init,
  Cache,
  NewPrayData,
  Warnings,
  Finished,
  NotifyMessage,
  FetchPrayerTimes,
  ResetAllData,
};
