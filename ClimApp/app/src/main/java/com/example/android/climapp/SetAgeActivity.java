package com.example.android.climapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.widget.NumberPicker;
import android.widget.Toast;

import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting and displaying the correct user age
 */

public class SetAgeActivity extends AppCompatActivity {

    SharedPreferences preferences;
    SharedPreferences.Editor editor;
    NumberPicker np;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_age);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        //Number picker for age
        np = (NumberPicker) findViewById(R.id.AgePicker);

        //Populate NumberPicker values from String array values
        //Set the minimum/maximum value of NumberPicker
        np.setMinValue(0); //from array first value
        np.setMaxValue(100); //to array last value
        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        // Get user age if already stated, otherwise 0
        if(preferences.getString("Age", null) != null) {
            System.out.println(preferences.getString("Age", null) );
            int userAge = (int) getUserAgeFromInput(preferences);
            np.setValue(userAge);
        } else {
            // Set initial value
            np.setValue(0);
        }

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                editor.putString("Age", newVal + "").commit();

                //Display the newly selected value from picker
                Toast.makeText(getApplicationContext(), getString(R.string.age_updated) + " " + newVal, Toast.LENGTH_SHORT).show();
            }
        });
    }

    public long getUserAgeFromInput(SharedPreferences preferences){
        String userInput = preferences.getString("Age", null);
        Log.v("HESTE", "in preferences");
        // Users date of birth from input
        Calendar userBirthDay = new GregorianCalendar(
                Integer.parseInt(userInput.substring(4)),
                Integer.parseInt(userInput.substring(2,4)),
                Integer.parseInt(userInput.substring(1,2)));
        // Todays date
        Calendar today = new GregorianCalendar();
        today.setTime(new Date());
        return today.get(Calendar.YEAR) - userBirthDay.get(Calendar.YEAR);
    }
}
