/*-------------------------------------------------------
 * Run jasmine test from cmd (climapp/cordova/climapp):
 * jasmine www/js/test/ui_test/jasmine_mocha_chai_test.js
 *-------------------------------------------------------*/

var yiewd = require("yiewd");
var chai = require("chai");
var expect = chai.expect;

var debugging = true;

var timeouts = {
  appium: debugging ? 60 : 10,              // Timeout before Appium stops the app
  framework: 1000 * (debugging ? 600 : 30), // Timeout for completing each test
};

var frameworks = {
    "mocha" : "mocha",
    "jasmine" : "jasmine"
  };

// Set this variable according to the framework you're using
///var framework = frameworks.mocha;
var framework = frameworks.jasmine;

var config = {};

config.android19 = {
  browserName: '',
  platformName: 'Android',
  platformVersion: "8.0.0",    // API level integer, or a version string like '4.4.2'
  autoWebview: true,
  deviceName: 'any value; Appium uses the first device from *adb devices*',
     app: "platforms\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk",
  newCommandTimeout: timeouts.appium,
};

var appDriver  = yiewd.remote({
    hostname: 'localhost',
    port: 4723,
    });

describe("Find feedback page", function () {
    switch (framework) {
        case frameworks.mocha:
            this.timeout(timeouts.framework)
            break;
  
        case frameworks.jasmine:
            jasmine.DEFAULT_TIMEOUT_INTERVAL = timeouts.framework;
            break;
    }
    it('submits feedback to DTU database or returns an error message', function (done) {
	    appDriver.run(function* () {
	        // 'this' is appDriver
	        var session = yield this.init(config.android19);
	        yield this.sleep(3000);
          
            var navData = yield this.elementById('settings_nav');
            yield navData.click();

            var settingsData = yield this.elementById('settings_feedback');
            yield settingsData.click();

            var feedbackComment = yield this.elementById('feedback_text');
	        yield feedbackComment.sendKeys("Automated testing sequence added!");

	        var btnSubmitFeedback = yield this.elementById('feedback_button');
	        yield btnSubmitFeedback.click();

            var navData = yield this.elementById('settings_nav');
            yield navData.click();

	        var resultScreen = yield this.elementById('main_panel');
            var settingsVisible = yield resultScreen.isDisplayed();
	      
	        expect(settingsVisible).to.equal(true);

	        // Tell the framework that we're done with the async series
	        done();
	    });
	});
});