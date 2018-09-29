package com.android.climapp.utils;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.android.climapp.R;

/**
 * Created by frksteenhoff on 09-04-2018.
 * Handling an alarm, creating a notification to the user
 */

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {

        Notification.Builder notification = new Notification.Builder(context)
                .setSmallIcon(R.mipmap.climapp_logo3_round)
                .setContentTitle("Daily weather information")
                .setContentText("See today's weather information");

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT < 16) {
            notificationManager.notify(1, notification.getNotification());
        } else {
            notificationManager.notify(1, notification.build());
        }
    }
}
