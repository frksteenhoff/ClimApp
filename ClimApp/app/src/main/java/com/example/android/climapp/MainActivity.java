package com.example.android.climapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;

/**
 * Created by frksteenhoff on 09-10-2017.
 */

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set the content of the activity to use the activity_main.xml layout file
        setContentView(R.layout.activity_main);
    }
}

