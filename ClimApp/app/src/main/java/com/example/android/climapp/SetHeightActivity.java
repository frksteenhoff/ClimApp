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

        int preferred_unit = preferences.getInt("Unit",0);
        String height_units[] = showCorrectHeightValues(preferred_unit);

        // Additional text stating input unit
        final TextView heightUnit = (TextView) findViewById(R.id.unit_text_height);
        setCorrectPickerUnit(heightUnit);

        //Number picker for height (feet, inches, meters) -- all should be converted to meters
        // before calculations are performed.
        NumberPicker np = (NumberPicker) findViewById(R.id.HeightPicker);

        //Populate NumberPicker values from String array values
        //Set the minimum/maximum value of NumberPicker
        np.setMinValue(0); //from array first value
        np.setMaxValue(height_units.length-1); //to array last value
        np.setDisplayedValues(height_units);

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
                Toast.makeText(getApplicationContext(), getString(R.string.height_updated) + " " + newVal + " " + heightUnit.getText().toString(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Fetching correct units array for each of the different unit types
     * @param preferred_unit
     * @return
     */
    private String[] showCorrectHeightValues(int preferred_unit) {
        String units[];
        // If unit chosen is "SI" -- use meters
        if (preferred_unit == 0) {
            units = new String[] {"1.20", "1.21", "1.22", "1.23", "1.24", "1.25", "1.26", "1.27", "1.28", "1.29",
                                  "1.30", "1.31", "1.32", "1.33", "1.34", "1.35", "1.36", "1.37", "1.38", "1.39",
                                  "1.40", "1.41", "1.42", "1.43", "1.44", "1.45", "1.46", "1.47", "1.48", "1.49",
                                  "1.50", "1.51", "1.52", "1.53", "1.54", "1.55", "1.56", "1.57", "1.58", "1.59",
                                  "1.60", "1.61", "1.62", "1.63", "1.64", "1.65", "1.66", "1.67", "1.68", "1.69",
                                  "1.70", "1.71", "1.72", "1.73", "1.74", "1.75", "1.76", "1.77", "1.78", "1.79",
                                  "1.80", "1.81", "1.82", "1.83", "1.84", "1.85", "1.86", "1.87", "1.88", "1.89",
                                  "1.90", "1.91", "1.92", "1.93", "1.94", "1.95", "1.96", "1.97", "1.98", "1.99",
                                  "2.00", "2.01", "2.02", "2.03", "2.04", "2.05", "2.06", "2.07", "2.08", "2.09",
                                  "2.10", "2.11", "2.12", "2.13", "2.14", "2.15", "2.16", "2.17", "2.18", "2.19",
                                  "2.20", "2.21", "2.22", "2.23", "2.24", "2.25", "2.26", "2.27", "2.28", "2.29",
                                  "2.30", "2.31", "2.32", "2.33", "2.34", "2.35", "2.36", "2.37", "2.38", "2.39",
                                  "2.40"};
        // If unit chosen is "US" or "UK" -- use feet/inches
        } else {
            units = new String[]{"3.11", "3.12",
                    "4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12",
                    "5.0", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12",
                    "6.0", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10", "6.11", "6.12",
                    "7.0", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "7.12",};
        }
        return units;
    }

    /**
     * Setting up the correct units to be displayed as input unit
     * @param heightUnit the text to be displayed alongside the numberpicker
     */
    private void setCorrectPickerUnit(TextView heightUnit) {
        int unit = preferences.getInt("Unit", 0);
        switch (unit) {
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

