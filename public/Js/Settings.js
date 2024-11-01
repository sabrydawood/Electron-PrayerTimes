const SettingsFormElement = document.getElementById("settings-form");
const CountryElement = document.getElementById("settings-country");
const CityElement = document.getElementById("settings-city");
const MethodElement = document.getElementById("settings-method");
const AppVersionElement= document.getElementById("AppVersion");
CountryElement.onchange = SetState;
CityElement.onchange = SetState;
MethodElement.onchange = SetState;
SettingsFormElement.onsubmit = HandleSubmit;
const State = {
  Id: "com.sabry.PrayerTimes",
  City: "Cairo",
  Country: "EG",
  Method: "5",
};
let PrayerTimesDate = {
  // Fajr: "19:57",
  // Dhuhr: "20:03",
  // Asr: "20:09",
  // Maghrib: "20:15",
  // Isha: "20:21",
};
console.log({
  PrayerTimesDate,
  State,
})
function SetState(e) {
  switch (e.target.name) {
    case "Country": {
      CountryElement.value = e.target.value;
      if (e.target.value != State.Country) {
        SetCities(e.target.value);
      }
      break;
    }
    case "City":
      CityElement.value = e.target.value;
      break;
    case "Method":
      MethodElement.value = e.target.value;
      break;
    default:
      break;
  }
  State[e.target.name] = e.target.value;
}
function UpdateUi(NewData, AppVersion) {
  CountryElement.value = NewData.Country;
  CityElement.value = NewData.City;
  MethodElement.value = NewData.Method;
  AppVersionElement.innerText = `الاصدار : ${AppVersion}`;
}
function HandleSubmit(e) {
  e.preventDefault();
  window.electronAPI.sendMessage("Settings-Update", State);
}
document.addEventListener("DOMContentLoaded", () =>
  SetOptionsData("DOMContentLoaded")
);
function SetOptionsData(Type) {
  SetCountries();
  SetCities(State.Country);
  SetMethods();
}
function SetCountries() {
  Countries.innerHTML = "";
  CountryElement.value = Countries[0]?.Code;
  Countries.map((Con) => {
    const Option = document.createElement("option");
    Option.value = Con.Code;
    Option.innerHTML = Con.CountryName;
    CountryElement.appendChild(Option);
  });
}
function SetCities(Country) {
  if (!Country) return;
  CityElement.innerHTML = "";
  CityElement.value = Cities[Country][0]?.CityNameEn;
  Cities[Country].map((City) => {
    const Option = document.createElement("option");
    Option.value = City.CityNameEn;
    Option.innerHTML = City.CityName;
    CityElement.appendChild(Option);
  });
}
function SetMethods() {
  MethodElement.innerHTML = "";
  MethodElement.value = Methods[0]?.Id;
  Methods.map((Method) => {
    const Option = document.createElement("option");
    Option.value = Method.Id;
    Option.innerHTML = Method.Name;
    MethodElement.appendChild(Option);
  });
}

function HandleSentNewCities(Country) {}

function ToggleSideBar() {
  const MenuLeft = document.getElementById("menu-left");
  const MenuRight = document.getElementById("menu-right");
  MenuRight.classList.toggle("closed");
  MenuLeft.classList.toggle("open");
  document.getElementById("sidebar").classList.toggle("closed");
}