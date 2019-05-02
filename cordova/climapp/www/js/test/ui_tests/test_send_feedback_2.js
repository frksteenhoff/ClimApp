var wd = require("wd");
var appDriver = wd.promiseChainRemote({
    hostname: 'localhost',
    port: 4723,
})

var config = {};

config.android19 = {
   browserName: '',
   platformName: 'Android',
   platformVersion: "8.0.0",// API level integer, or a version string like '4.4.2'
   autoWebview: true, // scoping subsequent commands sent through WebDriver API to Webview
   deviceName: 'any value; Appium uses the first device from *adb devices*',
   app: "platforms\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk" // always run tests from cordova/climapp
};
/*
config.iOS19 = {
    automationName: 'Appium',
    browserName: '',
    platformName: 'iOS',
    platformVersion: 19,// API level integer, or a version string like '4.4.2'
    autoWebview: true,
    deviceName: 'any value; Appium uses the first device from *adb devices*',
    app: "C:\Users\frksteenhoff\Documents\GitHub\ClimApp\cordova\climapp\platforms\android\app\build\outputs\apk\debug"
 };*/

appDriver.init(config.android19)
   .then(function () {
   // Wait 3 seconds for the app to fully start
      return appDriver.sleep(3000);
   }).then(function () {
      return appDriver.elementById('settings_nav');
   }).then(function (navSettings) {
      return navSettings.click(); // Tap the button
   }).then(function () {
      return appDriver.elementById('settings_feedback');
   }).then(function (btnFeedback) {
      return btnFeedback.click(); // Tap the button
   }).then(function () {
      return appDriver.elementById('feedback_text').sendKeys("Automated testing sequence added!");
   }).then(function () {
      return appDriver.elementById('feedback_button');
   }).then(function (btnSubmitFeedback) {
      return btnSubmitFeedback.click(); // Tap the button
   }).then(function () {
      return appDriver.sleep(1000);
   }).fin(function () {  //.fin means "finally" - end of the chain
         appDriver.quit()
   }).done();