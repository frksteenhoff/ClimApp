package com.android.climapp.settings;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.NumberPicker;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.utils.User;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting correct units for height according to chosen unit
 */

public class SetHeightActivity extends AppCompatActivity {

    private static SharedPreferences preferences;
    private User user;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_height);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        user = new User(preferences);
        int preferred_unit = preferences.getInt("Unit",0);
        final String height_values[] = user.showCorrectHeightValues(preferred_unit);

        // Additional text stating input unit
        final TextView heightUnit = findViewById(R.id.unit_text_height);
        setCorrectPickerUnit(heightUnit);

        //Number picker for height (feet, inches, meters) -- all should be converted to meters
        // before calculations are performed.
        NumberPicker np = findViewById(R.id.HeightPicker);

        //Populate NumberPicker values from String array values
        //Set the minimum/maximum value of NumberPicker
        np.setMinValue(0); //from array first value
        np.setMaxValue(height_values.length-1); //to array last value
        np.setDisplayedValues(height_values);


        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                // Save index position of height value
                preferences.edit().putInt("Height_index", newVal).apply();
                preferences.edit().putString("Height_value", height_values[newVal]).apply();

                //Display the newly selected value from picker
                Toast.makeText(getApplicationContext(),
                        getString(R.string.height_updated) + " " + height_values[newVal] + " " +
                                heightUnit.getText().toString(), Toast.LENGTH_SHORT).show();
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

