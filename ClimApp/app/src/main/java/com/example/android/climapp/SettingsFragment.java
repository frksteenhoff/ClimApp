package com.example.android.climapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.CompoundButton;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 10-10-2017.
 */

public class SettingsFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    public SettingsFragment() {
        // Required empty public constructor
    }

    // Initializing user input values
    private static SharedPreferences preferences;
    private Switch acclimatizationSwitch;
    private Spinner unitSpinner, genderSpinner, notificationSpinner;


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.settings_layout, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {

        preferences = getActivity().getSharedPreferences("ClimApp",Context.MODE_PRIVATE);
        unitSpinner = (Spinner) getActivity().findViewById(R.id.units_spinner);
        genderSpinner = (Spinner) getActivity().findViewById(R.id.gender_spinner);
        notificationSpinner = (Spinner) getActivity().findViewById(R.id.notification_spinner);
        acclimatizationSwitch = (Switch) getActivity().findViewById(R.id.acclimatization_switch_settings);

        // Set gender -- female as default
        genderSpinner.setSelection(preferences.getInt("gender", 0));
        genderSpinner.setOnItemSelectedListener(this);

        // Set units -- SI units as default
        unitSpinner.setSelection(preferences.getInt("Unit", 0));
        unitSpinner.setOnItemSelectedListener(this);

        // Set units -- SI units as default
        notificationSpinner.setSelection(preferences.getInt("Notification", 0));
        notificationSpinner.setOnItemSelectedListener(this);

        // Setting default user acclimatization
        acclimatizationSwitch.setChecked(preferences.getBoolean("Acclimatization",false));

        // setting up listeners for each of the settings to open an intent
        TextView ageSettings = (TextView) getActivity().findViewById(R.id.age_settings);
        ageSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent age_settings = new Intent(getActivity(), SetAgeActivity.class);
                startActivity(age_settings);
            }
        });

        TextView heightSettings = (TextView) getActivity().findViewById(R.id.height_settings);
        heightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent height_settings = new Intent(getActivity(), SetHeightActivity.class);
                startActivity(height_settings);
            }
        });

        TextView weightSettings = (TextView) getActivity().findViewById(R.id.weight_settings);
        weightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent weight_settings = new Intent(getActivity(), SetWeightActivity.class);
                startActivity(weight_settings);
            }
        });

        TextView acclimatizationSettings = (TextView) getActivity().findViewById(R.id.acclimatization);
        acclimatizationSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent acclimatization_settings = new Intent(getActivity(), SetAcclimatizationActivity.class);
                startActivity(acclimatization_settings);
            }
        });

        // TECHNICAL DEBT - same code existing here and in SetAcclimatizationActivity
        acclimatizationSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (isChecked) {
                    // The toggle is enabled
                    acclimatizationSwitch.setChecked(isChecked);
                    preferences.edit().putBoolean("Acclimatization", true).commit();
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_true), Toast.LENGTH_SHORT).show();
                } else {
                    // The toggle is disabled
                    acclimatizationSwitch.setChecked(isChecked);
                    preferences.edit().putBoolean("Acclimatization", false).commit();
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_false), Toast.LENGTH_SHORT).show();
                }
            }
        });

        // TODO: change into notification activity.
        TextView notificationSettings = (TextView) getActivity().findViewById(R.id.notifications);
        notificationSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent notification_settings = new Intent(getActivity(), SetNotificationActivity.class);
                startActivity(notification_settings);
            }
        });

        TextView resetSettings = (TextView) getActivity().findViewById(R.id.reset);
        resetSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Reset all preferences
                preferences = getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
                preferences.edit().clear().commit();
                // Setting onboarding to be true in order to prevent it from showing up again.
                //preferences.edit().putBoolean("onboarding_complete", true).commit();
                Toast.makeText(getActivity().getApplicationContext(), "All preferences cleared", Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Selecting correct spinner and saves its chosen value
     * @param adapterView
     * @param view
     * @param position
     * @param l
     */
    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        switch(adapterView.getId()){
            case R.id.gender_spinner:
                if (position == 0) {
                    // If female selected, show "female" in picker
                    preferences.edit().putInt("gender", 0).commit();
                } else {
                    // If UK units selected, show UK units in pickers
                    preferences.edit().putInt("gender", 1).commit();
                }
                break;
            case R.id.units_spinner:
                if (position == 0) {
                    // If SI units selected, show SI units in picker
                    preferences.edit().putInt("Unit", 0).commit();
                } else if (position == 1) {
                    // If US units selected, show US units in picker
                    preferences.edit().putInt("Unit", 1).commit();
                } else {
                    // If UK units selected, show UK units in picker
                    preferences.edit().putInt("Unit", 2).commit();
                }
            case R.id.notification_spinner:
                if (position == 0) {
                    // User wants notifications each day at 6AM
                    preferences.edit().putInt("Notification", 0).commit();
                } else if (position == 1) {
                    // User wants notifications each day at 7AM
                    preferences.edit().putInt("Notification", 1).commit();
                } else {
                    // User wants to setup custom notifications
                    Intent notification_settings = new Intent(getActivity(), SetNotificationActivity.class);
                    startActivity(notification_settings);
                }
        }
    }

    /**
     * Setting default value for gender and unit
     * Default  gender: female
     * Default unit: System Internationale (m, kg, l)
     * @param adapterView
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        switch (adapterView.getId()) {
            case R.id.gender_spinner:
                preferences.edit().putInt("gender", 0).commit();
            case R.id.units_spinner:
                preferences.edit().putInt("Unit", 0).commit();
            case R.id.notification_spinner:
                preferences.edit().putInt("Notification", 0).commit();
        }
    }
}

