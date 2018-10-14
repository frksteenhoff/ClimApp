package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.widget.NumberPicker;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.utils.User;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting the user's weight
 */

public class SetWeightActivity extends AppCompatActivity {

    private SharedPreferences preferences;
    private NumberPicker np;
    private int preferred_unit;
    private User user;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_weight);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        user = new User(preferences);
        // Set correct text indicating unit on UI
        final TextView weightUnit = findViewById(R.id.unit_text_weight);
        setCorrectPickerUnit(weightUnit);

        //Number picker for weight, set initial value
        np = findViewById(R.id.WeightPicker);

        // Set range of values to choose from
        preferred_unit = preferences.getInt("Unit",0);
        showCorrectPickerWeightValues(preferred_unit);

        // Set picker value based on user weigth in correct unit
        np.setValue(user.convertWeightToUnitFromKg(preferred_unit, preferences.getInt("Weight", 100)));

        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker -- always save
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                // Always saving weight in SI unit kilograms
                preferences.edit().putInt("Weight", user.convertWeightToKgFromUnit(preferred_unit, newVal)).apply();

                //Display the newly selected value from picker
                Toast.makeText(getApplicationContext(), getString(R.string.weight_updated) + " " + newVal + " " +
                        weightUnit.getText().toString(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Populate NumberPicker values from String array values
     * Set the minimum/maximum value of NumberPicker
     * @param preferred_unit the integer value representing the preferred unit in which to
     *                       measure a person's weight, in kg, punds or stones
     */
    private void showCorrectPickerWeightValues(int preferred_unit) {
        // If unit chosen is "US" - use pounds
        if (preferred_unit == 1) {
            np.setMinValue(85); //from array first value
            np.setMaxValue(775); //to array last value

            // If unit chosen is "UK", use stones
        } else if (preferred_unit == 2) {
            np.setMinValue(1); //from array first value
            np.setMaxValue(175); //to array last value

            // Default or if unit is "SI", use kilograms
        } else {
            np.setMinValue(40); //from array first value
            np.setMaxValue(350); //to array last value
        }
    }

    /**
     * Setting up the correct units to be displayed as input unit
     * @param unitText the text to be displayed alongside the numberpicker
     */
    private void setCorrectPickerUnit(TextView unitText) {
        int unit = preferences.getInt("Unit", 0);
        switch (unit) {
            case 1:
                unitText.setText(R.string.weight_unit_us);
                break;
            case 2:
                unitText.setText(R.string.weight_unit_uk);
                break;
            default:
                unitText.setText(R.string.weight_unit_si);
                break;
        }
    }

    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                Intent parentIntent = NavUtils.getParentActivityIntent(this);
                parentIntent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(parentIntent);
                finish();
                return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
