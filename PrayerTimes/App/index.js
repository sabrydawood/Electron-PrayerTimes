const { dialog, nativeImage } = require("electron");
const Fetcher = require("./FetchClient");
const Cache = new Map();
const DefaultData = {
  Fajr: "21:01",
  Dhuhr: "21:02",
  Asr: "21:03",
  Maghrib: "21:04",
  Isha: "21:05",
};
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
  Cache.set("ToDay", ToDay);
  Cache.set("NextDay", NextDayValue);
  const PrayerTimesUrl = `https://api.aladhan.com/v1/timingsByCity/${
    NextDay ? NextDay : ToDay
  }?city=cairo&country=EG&method=5`;
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
  } catch (error) {}
}

function NotifyMessage(
  title = "Prayer Times",
  body = "Prayer Times Body",
  detail
) {
  const appIcon = nativeImage.createFromPath("Icon.ico");
  //   const Show = Notify({
  //     title,
  //     body,
  //     silent: false,
  //     timeoutType: "default",
  //     icon: appIcon,
  //   });
  //   Show.show();
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
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
