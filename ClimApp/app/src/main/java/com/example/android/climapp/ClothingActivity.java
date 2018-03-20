package com.example.android.climapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class ClothingActivity extends AppCompatActivity {

    SharedPreferences preferences;
    SharedPreferences.Editor editor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.clothing_layout);

    }
}
