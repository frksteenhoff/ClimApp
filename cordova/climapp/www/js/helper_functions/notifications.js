/* 
 * Scheduling notifications
 */

function scheduleDefaultNotification(userWantsNotifications) {
	// If no notifications are already scheduled
	getAllNotifications();

	// Used for testing purposes
	//console.log(this.cancelAllNotifications());

	// TODO: Decide criteria for sending notification!
	// Only if user wants notification (have not chosen to opt out)
	if(extremeCriteriaMet() && userWantsNotifications) {
		// Set notification time and date today @ 4.30PM
		var today = new Date();
		today.setDate(today.getDate());
		today.setHours(16);
		today.setMinutes(30);
		today.setSeconds(0);
		var today_at_4_30_pm = new Date(today);

		// Notification which is triggered 16.30 every weekday
		cordova.plugins.notification.local.schedule({
			title: 'Feedback',
			text: 'How was your day?',
			smallIcon: 'res://icon-stencil',
			icon: 'res://icon',
			trigger: {
				type: "fix",
				at: today_at_4_30_pm.getTime()
		},
		actions: [
			{ id: 'feedback_yes', title: 'Open'},
			{ id: 'no',  title: 'Dismiss'}
		]
		});	
		
		// When user clicks "open" the feedback screen is opened
        /* NEED TO BE HANDELED!
        cordova.plugins.notification.local.on('feedback_yes', function (notification, eopts) { 
			self.loadUI('feedback');
		 });*/
	}
}

function getAllNotifications() {
	cordova.plugins.notification.local.getScheduledIds(function (scheduledIds) {
		console.log(scheduledIds.length);
		console.log("Scheduled IDs: " + scheduledIds.join(", "));
	});
}

function cancelAllNotifications() {
    cordova.plugins.notification.local.cancelAll(function () {
		console.log('All notifications canceled');
	});
}

function extremeCriteriaMet() {
    // define criteria
    return false;
}
