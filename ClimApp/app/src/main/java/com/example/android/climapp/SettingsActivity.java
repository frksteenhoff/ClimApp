package com.example.android.climapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.NumberPicker;

/**
 * Created by frksteenhoff on 10-10-2017.
 */

public class SettingsActivity extends AppCompatActivity {

    // Initializing user input values
    public String Gender;
    public int Age;
    public int Height;
    public int Weight;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        //Number picker for age
        NumberPicker np = (NumberPicker) findViewById(R.id.AgePicker);

        //Populate NumberPicker values from String array values
        //Set the minimum value of NumberPicker
        np.setMinValue(0); //from array first value

        //Specify the maximum value/number of NumberPicker
        np.setMaxValue(100); //to array last value

        //Gets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal){
                //Display the newly selected value from picker

            }
        });
        // Number picker for height
        NumberPicker he = (NumberPicker) findViewById(R.id.HeightPicker);

        //Populate NumberPicker values from String array values
        //Set the minimum value of NumberPicker
        he.setMinValue(0); //from array first value

        //Specify the maximum value/number of NumberPicker
        he.setMaxValue(100); //to array last value

        //Gets whether the selector wheel wraps when reaching the min/max value.
        he.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        he.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal){
                //Display the newly selected value from picker

            }
        });
    }
}

