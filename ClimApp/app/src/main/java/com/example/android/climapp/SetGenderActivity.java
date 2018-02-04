package com.example.android.climapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class SetGenderActivity extends AppCompatActivity {

    SharedPreferences preferences;
    SharedPreferences.Editor editor;
    static CheckBox cb_f;
    static CheckBox cb_m;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.gender_settings);
        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        // Setting gender based on settings saved in shared preferences, if none, then false
        cb_f = (CheckBox) findViewById(R.id.FemaleChecked);
        cb_f.setChecked(preferences.getBoolean(getString(R.string.female_checked), false));

        cb_m = (CheckBox) findViewById(R.id.MaleChecked);
        cb_m.setChecked(preferences.getBoolean(getString(R.string.male_checked), false));

        // Handling setting of gender: male
        // Checking of gender is mutually exclusive, only one of the two boxes can be checked at a time
        cb_m.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    cb_f.setChecked(false);
                    Toast.makeText(getApplicationContext(), R.string.male_checked, Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Handling setting of gender: female
        // Checking of gender is mutually exclusive, only one of the two boxes can be checked at a time
        cb_f.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    cb_m.setChecked(false);
                    Toast.makeText(getApplicationContext(), R.string.female_checked, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.v("HESTE", "Pause " + cb_f.isChecked() + " " + cb_m.isChecked());
        editor.putBoolean("male_checked", cb_m.isChecked());
        editor.putBoolean("female_checked", cb_f.isChecked());
        editor.commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.v("HESTE", "Resume " + cb_m.isChecked() + " " + cb_f.isChecked());
        cb_m.setChecked(preferences.getBoolean("male_checked", false));
        cb_f.setChecked(preferences.getBoolean("female_checked", false));
    }
}
