const ToDayDate = new Date();
const ToDay = `${ToDayDate.getDate()}-${
  ToDayDate.getMonth() + 1
}-${ToDayDate.getFullYear()}`;
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
const TimesReplcers = {
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
let PrayerTimesDate = {};
let NextPray = "";
let Warnings = {
  [ToDay]: {},
};
let Finished = {
  [ToDay]: {},
};
let PlayingAzan = false;
let WarnedAzan = false;

const PrayerTimes = document.getElementById("Prayer-Times");
window.addEventListener("DOMContentLoaded", () => fetchData());
window.electronAPI.onReply("Reply-Fetch-Data", (event, Data) => {
  const { Prayer, Database } = Data || {};
  Object.assign(State, Database)
  UpdateUi(Database)
  const PrayerLength = Object.keys(Prayer).length;
  if (PrayerLength < 1) {
    setTimeout(() => {
      fetchData();
    }, 3000);
  } else {
    PrayerTimesDate = Prayer;
    PrayerTimes.innerHTML = "";
    Object.entries(Prayer).map(([Name, Time]) => {
      const gridCol = document.createElement("div");
      gridCol.classList.add("grid-col");
      gridCol.innerHTML = `
            <p>
                ${ConvertTo12HourFormat(Time)}
            </p>
            <p>
                ${Names[Name]}
            </p>
            `;
      PrayerTimes.appendChild(gridCol);
      document.getElementById("loader").classList.add("closed");
      PrayerTimes.classList.remove("closed");
    });
  }
});
function fetchData() {
  document.getElementById("loader").classList.remove("closed");
  PrayerTimes.classList.add("closed");
  window.electronAPI.sendMessage("Fetch-Data", "Fetch-Data");
}
setInterval(() => {
  SetTime();
  GetNextPary();
}, 1000);
function SetTime() {
  const time = new Date();
  const DateValue = time.toLocaleString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: true,
  });
  const DateTime = time.toLocaleTimeString().slice(0, -3);
  document.getElementById("Date").innerText = DateValue;
  document.getElementById("time").innerText = ConvertTo12HourFormat(DateTime);
}
function ConvertTo12HourFormat(time) {
  let [hours, minutes] = time?.split(":")?.map(Number);
  let period = "صباحا";
  if (hours >= 12) {
    period = "مساءا";
    if (hours > 12) {
      hours -= 12;
    }
  }
  if (hours == 0) {
    hours = 12;
  }
  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
function ToggleSideBar() {
  const MenuLeft = document.getElementById("menu-left");
  const MenuRight = document.getElementById("menu-right");
  MenuRight.classList.toggle("closed");
  MenuLeft.classList.toggle("open");
  document.getElementById("sidebar").classList.toggle("closed");
}
function TimeToMinutes(time, add = 0) {
  const [hours, minutes] = time?.split(":")?.map(Number);
  return hours * 60 + minutes + add;
}
function FindNextPrayerTime(d, prayTimes) {
  const currentTimeInMinutes = TimeToMinutes(d);
  let nextTime = null;
  for (let i = 0; i < prayTimes.length; i++) {
    const prayerTimeInMinutes = TimeToMinutes(prayTimes[i]);
    if (prayerTimeInMinutes > currentTimeInMinutes) {
      nextTime = prayTimes[i];
      break;
    }
  }
  if (!nextTime) {
    nextTime = prayTimes[0];
  }
  return nextTime;
}
function GetNextPary() {
  const time = new Date().toLocaleTimeString()?.slice(0, -3);
  const FormatedNow = TimeToMinutes(time, 1);
  const PrayerKeys = Object.keys(PrayerTimesDate);
  const PrayTimes = Object.values(PrayerTimesDate);
  const nextPrayerTime = FindNextPrayerTime(time, PrayTimes);
  const nextPrayerName = Names[PrayerKeys[PrayTimes.indexOf(nextPrayerTime)]];
  const TimeUntilPray = TimeUntilPrayer(time, nextPrayerTime);
  const FormtedNext = TimeToMinutes(nextPrayerTime);
  if (FormatedNow == FormtedNext) {
    PlayAzan(nextPrayerName);
  }
  SetNextPyaryerTimeView(nextPrayerName, TimeUntilPray);
}
function SetNextPyaryerTimeView(nextPrayerName, TimeUntilPray) {
  const { showWarning, hours, minutes } = TimeUntilPray;
  document.getElementById("NextPrayName").innerText =
    nextPrayerName || "جاري التحديث ..";
  document.getElementById(
    "NextPrayTime"
  ).innerText = `المتبقي : ${hours} ساعة ${minutes} دقيقة`;
  if (showWarning) {
    PlayWarn(nextPrayerName);
  }
}
function TimeUntilPrayer(currentTime, prayerTime) {
  if (!currentTime || !prayerTime) {
    return { hours: 0, minutes: 0, showWarning: false };
  }
  const minutesToTime = (totalMinutes) => {
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
  const warningTime = minutesToTime(warningTimeMinutes);
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
function PlayAzan(nextPrayerName) {
  if (!PlayingAzan) {
    const IsLastPray = nextPrayerName == "العشاء";
    const RealName = Names[nextPrayerName];
    window.electronAPI.sendMessage("Pray-Time", {
      Name: nextPrayerName,
      RealName,
    });
    if (IsLastPray) {
      window.electronAPI.sendMessage("Pray-End", {
        Name: nextPrayerName,
        RealName,
      });
    }
    document.getElementById("playAudio").click();
    PlayingAzan = Date.now() + 5 * 60 * 1000;
    StopAzan();
  }
}
function StopAzan() {
  if (PlayingAzan < Date.now()) {
    PlayingAzan = false;
  } else {
    setTimeout(() => {
      StopAzan();
    }, 5000);
  }
}
function PlayWarn(nextPrayerName) {
  if (!WarnedAzan) {
    const RealName = Names[nextPrayerName];
    window.electronAPI.sendMessage("Pray-Warning", {
      Name: nextPrayerName,
      RealName,
    });
    WarnedAzan = Date.now() + 5 * 60 * 1000;
    StopWarn();
  }
}
function StopWarn() {
  if (WarnedAzan < Date.now()) {
    WarnedAzan = false;
  } else {
    setTimeout(() => {
      StopWarn();
    }, 5000);
  }
}

document.getElementById("playAudio").addEventListener("click", () => {
  const audio = document.getElementById("audioPlayer");
  audio.play();
});
