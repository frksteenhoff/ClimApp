/* 
 * Scheduling notifications
 */

function getAllNotifications() {
	cordova.plugins.notification.local.getScheduledIds(function (scheduledIds) {
		console.log("Scheduled IDs: " + scheduledIds.join(", "));
		return scheduledIds;
	});
}

function cancelAllNotifications() {
    cordova.plugins.notification.local.clearAll([getAllNotifications()]);
		console.log('All notifications canceled');
}