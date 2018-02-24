package com.example.android.climapp;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;
/**
 * Created by frksteenhoff on 24-02-2018.
 */

public class SetUnitsActivity extends AppCompatActivity implements AdapterView.OnItemSelectedListener {

    private static SharedPreferences preferences;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.units_settings);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        Spinner spinner = (Spinner) findViewById(R.id.units_spinner);

        // Set units -- SI units as default
        spinner.setSelection(preferences.getInt("Unit", 0));
        spinner.setOnItemSelectedListener(this);
    }
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {

                if(position == 0) {
                    // If SI units selected, show SI units in pickers
                    preferences.edit().putInt("Unit", 0).commit();

                } else if (position == 1) {
                    // If US units selected, show US units in pickers
                    preferences.edit().putInt("Unit", 1).commit();
                } else {
                    // If UK units selected, show UK units in pickers
                    preferences.edit().putInt("Unit", 2).commit();
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {
                // TODO: add something?
                // Right now not a problem, as SI units is chosen if nothing has been set.
            }
}
