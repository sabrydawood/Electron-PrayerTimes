const ToDay = moment().format("DD-MM-YYYY");
const Names = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
  الفجر: "Fajr",
  الظهر: "Dhuhr",
  العصر: "Asr",
  المغرب: "Maghrib",
  العشاء: "Isha",
};

const TimesReplacers = {
  13: 1,
  14: 2,
  15: 3,
  16: 4,
  17: 5,
  18: 6,
  19: 7,
  20: 8,
  21: 9,
  22: 10,
  23: 11,
};

let NextPray = "";
let Warnings = { [ToDay]: {} };
let Finished = { [ToDay]: {} };
let PlayingAzan = false;
let WarnedAzan = false;
const PrayerTimes = document.getElementById("Prayer-Times");
window.addEventListener("DOMContentLoaded", fetchData);
window.electronAPI.onReply("Reply-Fetch-Data", handleReplyFetchData);
function fetchData() {
  toggleLoader(true);
  window.electronAPI.sendMessage("Fetch-Data", "Fetch-Data");
}
function handleReplyFetchData(event, Data) {
  const { Prayer, Database, AppVersion } = Data || {};
  Object.assign(State, Database);
  UpdateUi(Database, AppVersion);
  if (Object.keys(Prayer).length < 1) {
    setTimeout(fetchData, 3000);
  } else {
    PrayerTimesDate = Prayer;
    updatePrayerTimesUI();
  }
}
function updatePrayerTimesUI() {
  PrayerTimes.innerHTML = "";
  Object.entries(PrayerTimesDate).forEach(([Name, Time]) => {
    const gridCol = document.createElement("div");
    gridCol.classList.add("grid-col");
    gridCol.innerHTML = `
      <p>${ConvertTo12HourFormat(
        moment(Time, "HH:mm").format("h:mm A"),
        true
      )}</p>
      <p id="PrayerName">${Names[Name]}</p>`;
    PrayerTimes.appendChild(gridCol);
  });
  toggleLoader(false);
}

function toggleLoader(isLoading) {
  document.getElementById("loader").classList.toggle("closed", !isLoading);
  PrayerTimes.classList.toggle("closed", isLoading);
}
setInterval(() => {
  SetTime();
  GetNextPrayer();
}, 1000);

function SetTime() {
  const time = new Date();
  document.getElementById("Date").innerText = time.toLocaleString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: true,
  });
  document.getElementById("time").innerText = ConvertTo12HourFormat(
    moment().format("hh:mm:ss A"),
    true
  );
}

function ConvertTo12HourFormat(time, IsMoment) {
  if (IsMoment) {
    return time.replace("AM", "صباحا").replace("PM", "مساءا");
    // .replace("ص", "صباحا")
    // .replace("م", "مساءا");
  }
  let [hours, minutes] = time?.split(":")?.map(Number);
  let period = "صباحا"; // Default to AM in Arabic

  if (hours >= 12) {
    period = "مساءا"; // PM in Arabic
    if (hours > 12) hours -= 12;
  }
  if (hours === 0) hours = 12;

  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function GetNextPrayer() {
  const nextPrayer = CalculateNextPrayer();
  if (nextPrayer) {
    SetNextPrayerView(nextPrayer.name, nextPrayer.timeRemaining);
    if (nextPrayer.isPrayerTime) {
      PlayAzan(nextPrayer.name);
    }
    if (nextPrayer.showWarning) {
      PlayWarn(nextPrayer.name);
    }
  }
}

function CalculateNextPrayer() {
  const currentTimeMins = moment().format("H:mm");
  const prayerTimes = Object.values(PrayerTimesDate);
  const nextPrayerTime = FindNextPrayerTime(currentTimeMins, prayerTimes);
  const LastPrayer = prayerTimes[prayerTimes.length - 1];
  const nextPrayerName =
    Names[Object.keys(PrayerTimesDate)[prayerTimes.indexOf(nextPrayerTime)]];
  const timeUntilNext = moment(nextPrayerTime, "H:mm", "ar").fromNow();
  const timeUntilNext5 = moment(currentTimeMins, "H:mm").isAfter(
    moment(LastPrayer, "H:mm")
  );
  const isShowWarning = timeUntilNext == "بعد ٥ دقائق";
  const isPrayerTime = timeUntilNext == "بعد ثانية واحدة";
  return {
    name: nextPrayerName,
    timeRemaining: timeUntilNext5
      ? ConvertTo12HourFormat(nextPrayerTime)
      : timeUntilNext,
    isPrayerTime,
    showWarning: isShowWarning,
  };
}

function FindNextPrayerTime(currentTime, prayerTimes) {
  const currentMinutes = TimeToMinutes(currentTime);

  return (
    prayerTimes.find(
      (prayerTime) => TimeToMinutes(prayerTime) > currentMinutes
    ) || prayerTimes[0]
  );
}

function SetNextPrayerView(prayerName, timeRemaining) {
  document.getElementById("NextPrayName").innerText =
    prayerName || "جاري التحديث ..";
  document.getElementById("NextPrayTime").innerText = timeRemaining == "Invalid date" ? "جاري التحديث .." : timeRemaining;
  // `المتبقي : ${timeRemaining.hours} ساعة ${timeRemaining.minutes} دقيقة`;
}

function TimeToMinutes(time, add = 0) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes + add;
}

function TimeUntilPrayer(currentTime, prayerTime) {
  if (!currentTime || !prayerTime) {
    return { hours: 0, minutes: 0, showWarning: false };
  }

  const MinutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const currentMinutes = TimeToMinutes(currentTime);
  const prayerMinutes = TimeToMinutes(prayerTime);
  let minutesUntilPrayer = prayerMinutes - currentMinutes;

  if (minutesUntilPrayer < 0) {
    minutesUntilPrayer += 1440;
  }

  let warningTimeMinutes = prayerMinutes - 5;
  if (warningTimeMinutes < 0) {
    warningTimeMinutes += 1440;
  }

  const warningTime = MinutesToTime(warningTimeMinutes);
  const hours = Math.floor(minutesUntilPrayer / 60);
  const minutes = minutesUntilPrayer % 60;

  return {
    hours,
    minutes,
    warning: warningTime,
    showWarning: currentTime == warningTime,
    IsPrayNow: currentTime == prayerTime,
  };
}

function PlayAzan(prayerName) {
  if (!PlayingAzan) {
    const RealName = Names[prayerName];
    window.electronAPI.sendMessage("Pray-Time", { Name: prayerName, RealName });
    document.getElementById("Azan-Btn").click();
    OpenModal(prayerName, false);
    PlayingAzan = Date.now() + 5 * 60 * 1000;
    StopAzan();
  }
}

function StopAzan() {
  if (PlayingAzan < Date.now()) {
    PlayingAzan = false;
  } else {
    setTimeout(StopAzan, 5000);
  }
}

function PlayWarn(prayerName) {
  if (!WarnedAzan) {
    const RealName = Names[prayerName];
    window.electronAPI.sendMessage("Pray-Warning", {
      Name: prayerName,
      RealName,
    });
    OpenModal(prayerName);
    document.getElementById("Warn-Btn").click();
    WarnedAzan = Date.now() + 5 * 60 * 1000;
    StopWarn();
  }
}

function StopWarn() {
  if (WarnedAzan < Date.now()) {
    WarnedAzan = false;
  } else {
    setTimeout(StopWarn, 5000);
  }
}

document
  .getElementById("Azan-Btn")
  .addEventListener("click", () => AzanPlayer.play());
document
  .getElementById("Warn-Btn")
  .addEventListener("click", () => WarnPlayer.play());
