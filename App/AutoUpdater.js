const { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

module.exports = (() => {
  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "تحيث التطبيق",
      message: "يوجد تحديث جديد للتطبيق. جاري تحميل التحديث ... ؟",
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "تحديث التطبيق",
        message: " تم الانتهاء من تحميل التحديث. هل تريد تطبيق التحديثات ؟",
        buttons: ["اعادة تشغيل التطبيق", "لاحقاً"],
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on("error", (error) => {
    dialog.showErrorBox(
      "فشل التحديث",
      error == null ? "خطأ غير معروف" : error.toString()
    );
  });
})();
