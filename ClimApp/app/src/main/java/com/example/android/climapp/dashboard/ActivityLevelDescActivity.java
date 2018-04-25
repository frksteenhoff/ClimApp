package com.example.android.climapp.dashboard;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;

import com.example.android.climapp.R;

/**
 * Created by frksteenhoff on 25-04-2018.
 * Opening the descriptions of all activity levels
 */

public class ActivityLevelDescActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_level_desc_layout);
    }
}
