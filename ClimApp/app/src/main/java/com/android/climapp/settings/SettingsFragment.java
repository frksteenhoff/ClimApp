package com.android.climapp.settings;

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

import com.android.climapp.R;
import com.android.climapp.utils.User;

/**
 * Created by frksteenhoff on 10-10-2017.
 * Controlling all settings actions:
 * Edit, save, reset etc.
 * Set correct subtextvalues under relevant titles
 */

public class SettingsFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    // Initializing user input values
    private static SharedPreferences preferences;
    private Switch acclimatizationSwitch;
    private TextView showWeight, showHeight, showAge;
    private User user;
    private SharedPreferences.OnSharedPreferenceChangeListener sharedListener;
    private int old_unit;
    public SettingsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.settings_layout, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {

        preferences = getActivity().getSharedPreferences("ClimApp",Context.MODE_PRIVATE);
        user = new User(preferences);

        // Apply settings information under settings title
        showAge = getActivity().findViewById(R.id.show_age);
        showPreferenceIntIfExists("Age", showAge);

        showHeight = getActivity().findViewById(R.id.show_height);
        showPreferenceStringIfExists("Height_value", showHeight);

        showWeight = getActivity().findViewById(R.id.show_weight);
        showWeightIfExists(showWeight);

        Spinner unitSpinner = getActivity().findViewById(R.id.units_spinner);
        Spinner genderSpinner = getActivity().findViewById(R.id.gender_spinner);
        Spinner notificationSpinner = getActivity().findViewById(R.id.notification_spinner);
        acclimatizationSwitch = getActivity().findViewById(R.id.acclimatization_switch_settings);

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

        // Setting up listeners for each of the settings to open an intent
        TextView ageSettings = getActivity().findViewById(R.id.age_settings);
        ageSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent age_settings = new Intent(getActivity(), com.android.climapp.settings.SetAgeActivity.class);
                startActivity(age_settings);
            }
        });

        TextView heightSettings = getActivity().findViewById(R.id.height_settings);
        heightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent height_settings = new Intent(getActivity(), com.android.climapp.settings.SetHeightActivity.class);
                startActivity(height_settings);
            }
        });

        TextView weightSettings = getActivity().findViewById(R.id.weight_settings);
        weightSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent weight_settings = new Intent(getActivity(), com.android.climapp.settings.SetWeightActivity.class);
                startActivity(weight_settings);
            }
        });

        TextView acclimatizationSettings = getActivity().findViewById(R.id.acclimatization);
        acclimatizationSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent acclimatization_settings = new Intent(getActivity(), com.android.climapp.settings.SetAcclimatizationActivity.class);
                startActivity(acclimatization_settings);
            }
        });

        // Setting index of user height
        if(preferences.getInt("Height_index",0) == 0 &&
                preferences.getString("Height_value", null) != null) {
            user.findClosestIndexValue(preferences.getString("Height_value", null),
                    user.showCorrectHeightValues(preferences.getInt("Unit",0)), preferences);
        }


        // TECHNICAL DEBT - same code existing here and in SetAcclimatizationActivity
        acclimatizationSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                acclimatizationSwitch.setChecked(isChecked);
                preferences.edit().putBoolean("Acclimatization", isChecked).apply();

                // Show Toast based on whether user switches from acclimatized or not acclimatized.
                if (isChecked) {
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_true), Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_false), Toast.LENGTH_SHORT).show();
                }
            }
        });

        TextView notificationSettings = getActivity().findViewById(R.id.notifications);
        notificationSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent notification_settings = new Intent(getActivity(), com.android.climapp.settings.SetNotificationActivity.class);
                startActivity(notification_settings);
            }
        });

        TextView resetSettings = getActivity().findViewById(R.id.reset);
        resetSettings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Reset all preferences
                resetPreferences();
            }
        });

        TextView aboutText = getActivity().findViewById(R.id.about);
        aboutText.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent about_desc = new Intent(getActivity(), com.android.climapp.settings.AboutAppActivity.class);
                startActivity(about_desc);
            }
        });

        /*
         * Update view when preferred unit changes
         */
        sharedListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
            public void onSharedPreferenceChanged(SharedPreferences prefs, String key) {
                // Update dashboard view when units are changed.
                String[] values = user.showCorrectHeightValues(preferences.getInt("Unit", 0));
                switch(key){
                    case "Height_value":
                        showHeight.setText(values[prefs.getInt("Height_index", 0)]);
                        break;
                    case "Weight":
                        int weight = 0;
                        if(isDefaultUnit()){
                            weight = prefs.getInt("Weight", 0);
                            showWeight.setText(weight+"");
                            // UK or US metric system both in feet and inches
                        } else {
                            weight = user.convertWeightToUnitFromKg(prefs.getInt("Unit", 0),
                                    prefs.getInt("Weight", 0));
                            showWeight.setText(weight+"");
                            }
                        break;
                    case "Age":
                        showAge.setText(prefs.getInt("Age", 0)+"");
                        break;
                    case "Unit":
                        recalculateHeightWeight(values, prefs.getInt("Unit", 0));
                        break;
                    default: // If preference not specified above, do nothing
                        break;
                }
            }
        };
        preferences.registerOnSharedPreferenceChangeListener(sharedListener);
    }

    private boolean isDefaultUnit() {
        return preferences.getInt("Unit", 0) == 0;
    }

    @Override
    public void onResume() {
        super.onResume();
        // Fetch data on weight from SetWeightActivity
        updateAllSettingsSubtexts();
    }

    @Override
    public void onPause() {
        super.onPause();
        preferences.registerOnSharedPreferenceChangeListener(sharedListener);
    }

    /**
     * Setting default value for gender and unit
     * Default gender: female
     * Default unit: System Internationale (m, kg, l)
     * @param adapterView the adapter that invoked the method -- important when saving settings
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        switch (adapterView.getId()) {
            case R.id.gender_spinner:
                preferences.edit().putInt("gender", 0).apply();
            case R.id.units_spinner:
                preferences.edit().putInt("Unit", 0).apply();
            case R.id.notification_spinner:
                preferences.edit().putInt("Notification", 0).apply();
        }
    }

    /**
     * Selecting correct spinner and saves its chosen value
     * Updating view with converted value where needed
     * @param adapterView the adapter that invoked the method
     * @param view not used
     * @param position the position that has been chosen
     * @param l not used
     */
    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        switch(adapterView.getId()){
            case R.id.gender_spinner:
                // 0 = female, 1 = male
                preferences.edit().putInt("gender", position).apply();
                break;
            case R.id.units_spinner:
                // 0 = SI, 1 = US, 2 = UK
                preferences.edit().putInt("Unit", position).apply();
                break;
            case R.id.notification_spinner:
                // Based on position, user wants notification at:
                // 0 - each day at 6AM
                // 1 - work days at 6AM
                // 2 - each day at 7AM
                // 3 - work days at 7AM
                // 4 - no notifications
                if (position == 0 || position == 1 || position == 2 || position == 3 ||position == 4) {
                    // User wants notifications each day at 6AM
                    preferences.edit().putInt("Notification", position).apply();
                } else {
                    // User wants to setup custom notifications
                    Intent notification_settings = new Intent(getActivity(), com.android.climapp.settings.SetNotificationActivity.class);
                    startActivity(notification_settings);
                }
        }
    }

    /**
     * Recalculate the height and weight values to fit the new unit of measurement
     * Make sure to only set a value when one has actually been given
     * @param values   The list of possible height values
     * @param position the chosen unit as integer
     */
    private void recalculateHeightWeight(String[] values, int position) {
        if(preferences.getInt("Height_idnnex", 0) != 0) {
            showHeight.setText(values[preferences.getInt("Height_index", 0)]);
        }
        if(preferences.getString("Height_value", null) != null) {
            preferences.edit().putString("Height_value", values[preferences.getInt("Height_index", 0)]).apply();
        }
        int weight = 0;
        // SI units
        if(position == 0) {
            if(preferences.getInt("Weight", 0) != 0){
                weight = preferences.getInt("Weight", 0);
                showWeight.setText(weight + "");
            }
        // UK or US metric system both in feet and inches
        } else {
            if(preferences.getInt("Weight", 0) != 0) {
                weight = user.convertWeightToUnitFromKg(position, preferences.getInt("Weight", 0));
                showWeight.setText(weight + "");
            }
        }
    }

    /**
     * Reset all preferences to default
     * Acclimatization  - off
     * Preferred unit   - SI
     * Gender           - female
     * Notifications    - none
     * Age              - 30 years
     * Height           - 1.8m
     * Weight           - 80kg
     * Clear age, height and weight from view (more intuitive to the user)
     */
    private void resetPreferences() {
        // Clear preferences
        preferences.edit().clear().apply();
        preferences.edit().putBoolean("Acclimatization", false).apply();
        preferences.edit().putInt("gender", 0).apply();
        preferences.edit().putInt("Unit", 0).apply();
        preferences.edit().putInt("Notification", 0).apply();

        // Clear information from view
        showAge.setText("");
        showHeight.setText("");
        showWeight.setText("");

        // Setting onboarding to be true in order to prevent it from showing up again.
        //preferences.edit().putBoolean("onboarding_complete", true).apply();
        Toast.makeText(getActivity().getApplicationContext(), R.string.prefs_cleared, Toast.LENGTH_SHORT).show();
    }

    /**
     * When settings have been updated, make sure to rerun all subtext values
     */
    private void updateAllSettingsSubtexts() {
        showPreferenceIntIfExists("Age", showAge);
        showPreferenceStringIfExists("Height_value", showHeight);
        showWeightIfExists(showWeight);
    }

    private void showPreferenceIntIfExists(String preferenceName, TextView view) {
        if(preferences.getInt(preferenceName, 0) != 0) {
            view.setText(preferences.getInt(preferenceName, 0)+"");
        }
    }

    private void showPreferenceStringIfExists(String preferenceName, TextView view) {
        if(preferences.getString(preferenceName, null) != null) {
            view.setText(preferences.getString(preferenceName, null));
        }
    }

    private void showWeightIfExists(TextView view) {
        if(preferences.getInt("Weight", 0) != 0) {
            int preferred_unit = preferences.getInt("Unit", 0);
            int weight = preferences.getInt("Weight", 0);
            view.setText(String.format("%s", user.convertWeightToUnitFromKg(preferred_unit, weight)));
        }
    }
}
