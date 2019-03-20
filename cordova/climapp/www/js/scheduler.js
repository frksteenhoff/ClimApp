/*
 * Handling all notifications that can be sent to the user
 * Only one notification is allowed per day (current logic)
 * Apparently it is not allowed to require/import functionality?
 */
let scheduledNotifications = [];

let scheduleDefaultNotification = function() {
    if(scheduledNotifications.length > 0) {
        cancelAllNotifications();
    } 
    // Scheduling a notification 1 minute from time it opens
    cordova.plugins.notification.local.schedule({
        title: 'Feedback',
        text: 'Ready to give some feedback?',
        trigger: { in: 1, unit: 'minute' },
        actions: [
            { id: 'positive', title: 'Yes' },
            { id: 'negative',  title: 'No' }
        ]
    });
};

let scheduleCustomNotification = function(day, time, recurrence, header, text) {
    
};

let cancelNotification = function() {
    window.plugin.notification.local.cancel(ID, function () {
        // The notification has been canceled
    }, scope);    
};

let cancelAllNotifications = function() {
    window.plugin.notification.local.cancelAll(function () {
        // All notifications have been canceled
        console.log('All notifications canceled');
    }, scope);
};


let isScheduled = function() {
    window.plugin.notification.local.isScheduled(id, function (isScheduled) {
        console.log('Notification with ID ' + id + ' is scheduled: ' + isScheduled);
    }, scope);
}

let getAllNotifications = function() {
    window.plugin.notification.local.getScheduledIds(function (scheduledIds) {
        // alert('Scheduled IDs: ' + scheduledIds.join(' ,'));
    }, scope);
}

export {scheduledNotifications, scheduleDefaultNotification, scheduleCustomNotification,  getAllNotifications, cancelNotification, cancelAllNotifications, isScheduled, getAllNotifications};