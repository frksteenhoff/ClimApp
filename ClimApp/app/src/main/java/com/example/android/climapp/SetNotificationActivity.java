package com.example.android.climapp;

        import android.content.SharedPreferences;
        import android.os.Bundle;
        import android.support.v7.app.AppCompatActivity;
        import android.widget.Spinner;

/**
 * Created by frksteenhoff on 28-03-2018.
 * Setting custom user notifications
 */

public class SetNotificationActivity extends AppCompatActivity {

    private SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private Spinner notificationSpinner;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_notification);

    }
}
