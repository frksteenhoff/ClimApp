package com.android.climapp.settings;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.util.Log;
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
import com.android.climapp.data.Api;
import com.android.climapp.data.RequestHandler;
import com.android.climapp.utils.Utils;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

import static com.android.climapp.utils.ApplicationConstants.ACCLIMATIZATION;
import static com.android.climapp.utils.ApplicationConstants.AGE;
import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.CODE_GET_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.CODE_POST_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.DB_GENDER;
import static com.android.climapp.utils.ApplicationConstants.DB_ID;
import static com.android.climapp.utils.ApplicationConstants.DB_UNIT;
import static com.android.climapp.utils.ApplicationConstants.EXPLORE_ENABLED;
import static com.android.climapp.utils.ApplicationConstants.GENDER;
import static com.android.climapp.utils.ApplicationConstants.GUID;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_INDEX;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_VALUE;
import static com.android.climapp.utils.ApplicationConstants.NOTIFICATION;
import static com.android.climapp.utils.ApplicationConstants.UNIT;
import static com.android.climapp.utils.ApplicationConstants.WEIGHT;

/**
 * Created by frksteenhoff on 10-10-2017.
 * Controlling all settings actions:
 * Edit, save, reset etc.
 * Set correct subtextvalues under relevant titles
 */

public class SettingsFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    // Initializing utils input values
    private static SharedPreferences preferences;
    private Spinner unitSpinner, genderSpinner;
    private Switch acclimatizationSwitch, exploreSwitch;
    private TextView showWeight, showHeight, showAge;
    private Utils utils;
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

        preferences = getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);
        utils = new Utils(preferences);

        // Apply settings information under settings title
        showAge = getActivity().findViewById(R.id.show_age);
        showPreferenceIntIfExists(AGE, showAge);

        showHeight = getActivity().findViewById(R.id.show_height);
        showPreferenceStringIfExists(HEIGHT_VALUE, showHeight);

        showWeight = getActivity().findViewById(R.id.show_weight);
        showWeightIfExists(showWeight);

        unitSpinner = getActivity().findViewById(R.id.units_spinner);
        genderSpinner = getActivity().findViewById(R.id.gender_spinner);
        Spinner notificationSpinner = getActivity().findViewById(R.id.notification_spinner);
        acclimatizationSwitch = getActivity().findViewById(R.id.acclimatization_switch_settings);

        if (EXPLORE_ENABLED) {
            exploreSwitch = getActivity().findViewById(R.id.explore_switch_settings);
        }
        // Set gender -- female as default
        genderSpinner.setSelection(preferences.getInt(GENDER, 0));
        genderSpinner.setOnItemSelectedListener(this);

        // Set units -- SI units as default
        unitSpinner.setSelection(preferences.getInt(UNIT, 0));
        unitSpinner.setOnItemSelectedListener(this);

        // Set units -- SI units as default
        notificationSpinner.setSelection(preferences.getInt(NOTIFICATION, 0));
        notificationSpinner.setOnItemSelectedListener(this);

        // Setting default utils acclimatization
        acclimatizationSwitch.setChecked(preferences.getBoolean(ACCLIMATIZATION, false));
        if (EXPLORE_ENABLED) {
            exploreSwitch.setChecked(preferences.getBoolean("Explore", false));
        }

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

        TextView feedbackModule = getActivity().findViewById(R.id.feedback);
        feedbackModule.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent feedback_module = new Intent(getActivity(), com.android.climapp.settings.FeedbackActivity.class);
                startActivity(feedback_module);
            }
        });


        // Setting index of utils height
        if (preferences.getInt(HEIGHT_INDEX, 0) == 0 &&
                preferences.getString(HEIGHT_VALUE, null) != null) {
            utils.findClosestIndexValue(preferences.getString(HEIGHT_VALUE, null),
                    utils.showCorrectHeightValues(preferences.getInt(UNIT, 0)), preferences);
        }

        // TECHNICAL DEBT - same code existing here and in SetAcclimatizationActivity
        acclimatizationSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                acclimatizationSwitch.setChecked(isChecked);
                preferences.edit().putBoolean(ACCLIMATIZATION, isChecked).apply();

                // Show Toast based on whether utils switches from acclimatized or not acclimatized.
                if (isChecked) {
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_true), Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getActivity().getApplicationContext(), getString(R.string.acclimatization_false), Toast.LENGTH_SHORT).show();
                }
            }
        });

        if(EXPLORE_ENABLED) {
            exploreSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                    exploreSwitch.setChecked(isChecked);
                    preferences.edit().putBoolean("Explore", isChecked).apply();

                    // Show Toast based on whether utils switches on explore mode
                    if (isChecked) {
                        Toast.makeText(getActivity().getApplicationContext(), getString(R.string.explore_true), Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getActivity().getApplicationContext(), getString(R.string.explore_false), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
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
                String[] values = utils.showCorrectHeightValues(preferences.getInt(UNIT, 0));

                HashMap<String, String> params = new HashMap<>();
                PerformNetworkRequest request;
                switch(key){
                    case HEIGHT_VALUE:
                        showHeight.setText(values[prefs.getInt(HEIGHT_INDEX, 0)]);
                        break;
                    case WEIGHT:
                        int weight = 0;
                        if(isDefaultUnit()){
                            weight = prefs.getInt(WEIGHT, 0);
                            showWeight.setText(weight+"");
                            // UK or US metric system both in feet and inches
                        } else {
                            weight = utils.convertWeightToUnitFromKg(prefs.getInt(UNIT, 0),
                                    prefs.getInt(WEIGHT, 0));
                            showWeight.setText(weight+"");
                            }
                        break;
                    case UNIT:
                        recalculateHeightWeight(values, prefs.getInt(UNIT, 0));

                        // Update age in database
                        params.put(DB_ID, preferences.getString(GUID, null));
                        params.put(DB_UNIT, Integer.toString(preferences.getInt(UNIT, 0)));

                        request = new PerformNetworkRequest(Api.URL_UPDATE_USER_UNIT, params, CODE_POST_REQUEST);
                        request.execute();
                        break;
                    case GENDER:
                        // Update age in database
                        params.put(DB_ID, preferences.getString(GUID, null));
                        params.put(DB_GENDER, Integer.toString(preferences.getInt(GENDER, 0)));

                        request = new PerformNetworkRequest(Api.URL_UPDATE_USER_GENDER, params, CODE_POST_REQUEST);
                        request.execute();
                        break;
                    default: // If preference not specified above, do nothing
                        break;
                }
            }
        };
        preferences.registerOnSharedPreferenceChangeListener(sharedListener);
    }

    private boolean isDefaultUnit() {
        return preferences.getInt(UNIT, 0) == 0;
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
                preferences.edit().putInt(GENDER, 0).apply();
            case R.id.units_spinner:
                preferences.edit().putInt(UNIT, 0).apply();
            case R.id.notification_spinner:
                preferences.edit().putInt(NOTIFICATION, 0).apply();
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
                preferences.edit().putInt(GENDER, position).apply();
                break;
            case R.id.units_spinner:
                // 0 = SI, 1 = US, 2 = UK
                preferences.edit().putInt(UNIT, position).apply();
                break;
            case R.id.notification_spinner: // currently not used
                // Based on position, utils wants notification at:
                // 0 - each day at 6AM
                // 1 - work days at 6AM
                // 2 - each day at 7AM
                // 3 - work days at 7AM
                // 4 - no notifications
                if (position == 0 || position == 1 || position == 2 || position == 3 ||position == 4) {
                    // Utils wants notifications each day at 6AM
                    preferences.edit().putInt(NOTIFICATION, position).apply();
                } else {
                    // Utils wants to setup custom notifications
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
        if(preferences.getInt(HEIGHT_INDEX, 0) != 0) {
            showHeight.setText(values[preferences.getInt(HEIGHT_INDEX, 0)]);
        }
        if(preferences.getString(HEIGHT_VALUE, null) != null) {
            preferences.edit().putString(HEIGHT_VALUE, values[preferences.getInt(HEIGHT_INDEX, 0)]).apply();
        }
        int weight = 0;
        // SI units
        if(position == 0) {
            if(preferences.getInt(WEIGHT, 0) != 0){
                weight = preferences.getInt(WEIGHT, 0);
                showWeight.setText(weight + "");
            }
        // UK or US metric system both in feet and inches
        } else {
            if(preferences.getInt(WEIGHT, 0) != 0) {
                weight = utils.convertWeightToUnitFromKg(position, preferences.getInt(WEIGHT, 0));
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
     * Clear age, height and weight from view (more intuitive to the utils)
     */
    private void resetPreferences() {
        // Clear personal preferences (not using clear as we want to store some informations still)
        preferences.edit().remove(ACCLIMATIZATION).apply();
        preferences.edit().remove(UNIT).apply();
        preferences.edit().remove(GENDER).apply();
        preferences.edit().remove(NOTIFICATION).apply();
        preferences.edit().remove(AGE).apply();
        preferences.edit().remove(UNIT).apply();
        preferences.edit().remove(HEIGHT_VALUE).apply();
        preferences.edit().remove(HEIGHT).apply();
        preferences.edit().remove(HEIGHT_INDEX).apply();
        preferences.edit().remove(WEIGHT).apply();

        preferences.edit().putBoolean(ACCLIMATIZATION, false).apply();
        if(EXPLORE_ENABLED) {
            preferences.edit().putBoolean("Explore", false).apply();
        }
        preferences.edit().putInt(GENDER, 0).apply();
        preferences.edit().putInt(UNIT, 0).apply();
        preferences.edit().putInt(NOTIFICATION, 0).apply();

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
        showPreferenceIntIfExists(AGE, showAge);
        showPreferenceStringIfExists(HEIGHT_VALUE, showHeight);
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
        if(preferences.getInt(WEIGHT, 0) != 0) {
            int preferred_unit = preferences.getInt(UNIT, 0);
            int weight = preferences.getInt(WEIGHT, 0);
            view.setText(String.format("%s", utils.convertWeightToUnitFromKg(preferred_unit, weight)));
        }
    }

    /*
     * Network request to connect API with database
     * */
    private class PerformNetworkRequest extends AsyncTask<Void, Void, String> {
        String url;
        HashMap<String, String> params;
        int requestCode;

        PerformNetworkRequest(String url, HashMap<String, String> params, int requestCode) {
            this.url = url;
            this.params = params;
            this.requestCode = requestCode;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            try {
                JSONObject object = new JSONObject(s);
                if (!object.getBoolean("error")) {
                    Log.v("HESTE", object.getString("message"));
                } else {
                    Log.v("HESTE", "PHP response message: " + object.getString("message"));
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        @Override
        protected String doInBackground(Void... voids) {
            RequestHandler requestHandler = new RequestHandler();

            if (requestCode == CODE_POST_REQUEST) {
                return requestHandler.sendPostRequest(url, params);
            }

            if (requestCode == CODE_GET_REQUEST) {
                return requestHandler.sendGetRequest(url);
            }
            return null;
        }
    }
}
