package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.widget.NumberPicker;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.data.Api;
import com.android.climapp.data.RequestHandler;
import com.android.climapp.utils.Utils;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.CODE_GET_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.CODE_POST_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.DB_ID;
import static com.android.climapp.utils.ApplicationConstants.DB_WEIGHT;
import static com.android.climapp.utils.ApplicationConstants.DEFAULT_WEIGHT;
import static com.android.climapp.utils.ApplicationConstants.GUID;
import static com.android.climapp.utils.ApplicationConstants.UNIT;
import static com.android.climapp.utils.ApplicationConstants.WEIGHT;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting the utils's weight
 */

public class SetWeightActivity extends AppCompatActivity {

    private SharedPreferences preferences;
    private NumberPicker np;
    private int preferred_unit;
    private Utils utils;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_weight);

        preferences = getSharedPreferences(APP_NAME, MODE_PRIVATE);
        utils = new Utils(preferences);
        // Set correct text indicating unit on UI
        final TextView weightUnit = findViewById(R.id.unit_text_weight);
        setCorrectPickerUnit(weightUnit);

        //Number picker for weight, set initial value
        np = findViewById(R.id.WeightPicker);

        // Set range of values to choose from
        preferred_unit = preferences.getInt(UNIT,0);
        showCorrectPickerWeightValues(preferred_unit);

        // Set picker value based on utils weigth in correct unit
        np.setValue(utils.convertWeightToUnitFromKg(preferred_unit, preferences.getInt(WEIGHT, DEFAULT_WEIGHT)));

        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker -- always save
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                // Always saving weight in SI unit kilograms
                preferences.edit().putInt(WEIGHT, utils.convertWeightToKgFromUnit(preferred_unit, newVal)).apply();

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
        int unit = preferences.getInt(UNIT, 0);
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
                // Update age in database
                HashMap<String, String> params = new HashMap<>();
                params.put(DB_ID, preferences.getString(GUID, null));
                params.put(DB_WEIGHT, Integer.toString(preferences.getInt(WEIGHT, 0)));

                PerformNetworkRequest request = new PerformNetworkRequest(Api.URL_UPDATE_USER_WEIGHT, params, CODE_POST_REQUEST);
                request.execute();

                Intent parentIntent = NavUtils.getParentActivityIntent(this);
                parentIntent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(parentIntent);
                finish();
                return true;
        }
        return super.onOptionsItemSelected(item);
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
                    //Toast.makeText(getApplicationContext(), object.getString("message"), Toast.LENGTH_SHORT.show();
                } else {
                    Toast.makeText(getApplicationContext(), R.string.db_error, Toast.LENGTH_SHORT).show();

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
