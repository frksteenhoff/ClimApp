package com.example.android.climapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.NumberPicker;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class SetWeightActivity extends AppCompatActivity {
    public int Weight;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.weight_settings);

        //Number picker for age
        NumberPicker np = (NumberPicker) findViewById(R.id.WeightPicker);

        //Populate NumberPicker values from String array values
        //Set the minimum/maximum value of NumberPicker
        np.setMinValue(0); //from array first value
        np.setMaxValue(350); //to array last value

        //Gets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                //Display the newly selected value from picker
                Toast.makeText(getApplicationContext(), "Weight updated to " + newVal, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
