var wd = require("wd");
var appDriver = wd.promiseChainRemote({
    hostname: '127.0.0.1',
    port: 4723,
})

var config = {};

config.android19 = {
   browserName: '',
   platformName: 'Android',
   platformVersion: "8.0.0",// API level integer, or a version string like '4.4.2'
   autoWebview: true, // scoping subsequent commands sent through WebDriver API to Webview
   deviceName: 'any value; Appium uses the first device from *adb devices*',
   app: "platforms\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk"
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
    .sleep(3000)
    .elementById('settings_nav')
    .click()
    .elementById('settings_feedback')
    .click()
    .elementById('feedback_text')
    .sendKeys('Automated testing sequence added!')
    .elementById('feedback_button')
    .click()
    .quit();