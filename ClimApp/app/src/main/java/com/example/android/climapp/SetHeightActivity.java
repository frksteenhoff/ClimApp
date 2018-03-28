package com.example.android.climapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.NumberPicker;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class SetHeightActivity extends AppCompatActivity {

    private static SharedPreferences preferences;
    private static SharedPreferences.Editor editor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_height);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        // Additional text stating input unit
        TextView heightUnit = (TextView) findViewById(R.id.unit_text_height);
        setCorrectPickerUnit(heightUnit);

        //Number picker for age
        NumberPicker np = (NumberPicker) findViewById(R.id.HeightPicker);

        //Populate NumberPicker values from String array values
        //Set the minimum/maximum value of NumberPicker
        np.setMinValue(0); //from array first value
        np.setMaxValue(250); //to array last value

        // Setting default user height
        np.setValue(preferences.getInt("Height",0));

        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                editor.putInt("Height", newVal).commit();

                //Display the newly selected value from picker
                Toast.makeText(getApplicationContext(), getString(R.string.height_updated) + " " + newVal, Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Setting up the correct units to be displayed as input unit
     * @param heightUnit the text to be displayed alongside the numberpicker
     */
    private void setCorrectPickerUnit(TextView heightUnit) {
        int unit = preferences.getInt("Unit", 0);
        switch (unit) {
            case 0:
                heightUnit.setText(R.string.height_unit_si);
                break;
            case 1:
                heightUnit.setText(R.string.height_unit_uk);
                break;
            case 2:
                heightUnit.setText(R.string.height_unit_us);
                break;
            default:
                heightUnit.setText(R.string.height_unit_si);
                break;
        }
    }
}

