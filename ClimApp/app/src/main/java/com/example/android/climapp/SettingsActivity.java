package com.example.android.climapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.TextView;

/**
 * Created by frksteenhoff on 10-10-2017.
 */

public class SettingsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings2);

        // setting up listeners for each of the settings to open an intent
        TextView ageSettings = (TextView) findViewById(R.id.age_settings);
        ageSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent age_settings = new Intent(SettingsActivity.this, SetAgeActivity.class);
                startActivity(age_settings);
            }
        });

        TextView genderSettings = (TextView) findViewById(R.id.gender_settings);
        genderSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent gender_settings = new Intent(SettingsActivity.this, SetGenderActivity.class);
                startActivity(gender_settings);
            }
        });

        TextView heightSettings = (TextView) findViewById(R.id.height_settings);
        heightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent height_settings = new Intent(SettingsActivity.this, SetHeightActivity.class);
                startActivity(height_settings);
            }
        });

        TextView weightSettings = (TextView) findViewById(R.id.weight_settings);
        weightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent weight_settings = new Intent(SettingsActivity.this, SetWeightActivity.class);
                startActivity(weight_settings);
            }
        });

        TextView fitnessSettings = (TextView) findViewById(R.id.fitness_settings);
        fitnessSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent fitness_settings = new Intent(SettingsActivity.this, SetFitnessLevelActivity.class);
                startActivity(fitness_settings);
            }
        });
    }
}

