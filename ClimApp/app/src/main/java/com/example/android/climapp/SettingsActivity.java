package com.example.android.climapp;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 10-10-2017.
 */

public class SettingsActivity extends AppCompatActivity {

    private static SharedPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings2);
        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);

        RadioGroup genderChecked = (RadioGroup) findViewById(R.id.gender_group);
        setRadioButtonChecked(genderChecked);

        genderChecked.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {

                // Setting gender 1 = male, 0 = female
                if(checkedId == R.id.radio_male) {
                    preferences.edit().putBoolean("gender", true).commit();
                } else {
                    preferences.edit().putBoolean("gender", false).commit();
                }
            }
        });

        // setting up listeners for each of the settings to open an intent
        TextView ageSettings = (TextView) findViewById(R.id.age_settings);
        ageSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent age_settings = new Intent(SettingsActivity.this, SetAgeActivity.class);
                startActivity(age_settings);
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

        TextView unitsSettings = (TextView) findViewById(R.id.units);
        unitsSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent unit_settings = new Intent(SettingsActivity.this, SetUnitsActivity.class);
                startActivity(unit_settings);
            }
        });

        TextView resetSettings = (TextView) findViewById(R.id.reset);
        resetSettings.setOnClickListener(new View.OnClickListener() {
             @Override
              public void onClick(View v) {
                 // Reset all preferences
                 preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
                 preferences.edit().clear().commit();
                 // Setting onboarding to be true in order to prevent it from showing up again.
                 preferences.edit().putBoolean("onboarding_complete", true).commit();
                 Toast.makeText(getApplicationContext(), "All preferences cleared", Toast.LENGTH_SHORT).show();
             }
        });
    }

    private void setRadioButtonChecked(RadioGroup genderChecked) {
        if(preferences.getBoolean("gender", false) == false) {
            genderChecked.check(R.id.radio_female);
        } else {
            genderChecked.check(R.id.radio_male);
        }
    }
}

