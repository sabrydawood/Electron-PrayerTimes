const { ipcMain } = require("electron");
const {
  NewPrayData,
  NotifyMessage,
  FetchPrayerTimes,
  Warnings,
  Finished,
  ResetAllData,
} = require(".");
const JsonDb = require("./JsonDb");
const Config = require("./Config");
const OldDb = new JsonDb("Database");

module.exports = (() => {
  ipcMain.on("message-from-renderer", (event, arg) => {
    event.sender.send("reply-from-main", "Hello from the main process!");
  });
  ipcMain.on("Fetch-Data", (event, arg) => {
    event.sender.send("Reply-Fetch-Data", {
      Prayer: NewPrayData,
      Database: OldDb.Get(),
      AppVersion: Config.AppVersion
    });
  });
  ipcMain.on("Pray-Warning", (event, arg) => {
    const { Name, RealName } = arg;
    const Body = `صلاة ${Name}`;
    const Message = `باقي من الزمن 5 دقائق علي صلاة ${Name}`;
    if (!Warnings[RealName]) {
      NotifyMessage("اوقات الصلاوات", Body, Message);
    }
  });
  ipcMain.on("Pray-Time", (event, arg) => {
    const { Name, RealName } = arg;
    const Body = `صلاة ${Name}`;
    const Message = `حان الان صلاة ${Name}`;
    if (!Finished[RealName]) {
      NotifyMessage("اوقات الصلاوات", Body, Message);
    }
  });
  ipcMain.on("Pray-End", async (event, arg) => {
    ResetAllData();
    const NextDayData = await FetchPrayerTimes(true);
    event.sender.send("Reply-Fetch-Data", {
      Prayer: NextDayData,
      Database: OldDb.Get(),
    });
  });
  ipcMain.on("Settings-Update", async (event, args) => {
    const { Id, City, Country, Method } = args || {};
    if (Id && City && Country && Method) {
      OldDb.Update(
        {
          City,
          Country,
          Method,
        },
        Id
      );
      NotifyMessage('عملية "تحديث الاعدادات"', "تم تحديث الاعدادات بنجاح");
    }
    const NextDayData = await FetchPrayerTimes(false);
    event.sender.send("Reply-Fetch-Data", {
      Prayer: NextDayData,
      Database: OldDb.Get(),
      AppVersion: Config.AppVersion
    });
  });
})();
