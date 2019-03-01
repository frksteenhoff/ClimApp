package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
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
import static com.android.climapp.utils.ApplicationConstants.DB_HEIGHT;
import static com.android.climapp.utils.ApplicationConstants.DB_ID;
import static com.android.climapp.utils.ApplicationConstants.GUID;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_INDEX;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_VALUE;
import static com.android.climapp.utils.ApplicationConstants.UNIT;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting correct units for height according to chosen unit
 */

public class SetHeightActivity extends AppCompatActivity {

    private static SharedPreferences preferences;
    private Utils utils;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_height);

        preferences = getSharedPreferences(APP_NAME, MODE_PRIVATE);
        utils = new Utils(preferences);
        int preferred_unit = preferences.getInt(UNIT,0);
        final String height_values[] = utils.showCorrectHeightValues(preferred_unit);

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
        np.setValue(preferences.getInt(HEIGHT_INDEX, 0));

        //Sets whether the selector wheel wraps when reaching the min/max value.
        np.setWrapSelectorWheel(true);

        //Set a value change listener for NumberPicker
        np.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker picker, int oldVal, int newVal) {
                // Save index position of height value
                preferences.edit().putInt(HEIGHT_INDEX, newVal).apply();
                preferences.edit().putString(HEIGHT_VALUE, height_values[newVal]).apply();

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
        int unit = preferences.getInt(UNIT, 0);
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

    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                HashMap<String, String> params = new HashMap<>();
                params.put(DB_ID, preferences.getString(GUID, null));
                params.put(DB_HEIGHT, Integer.toString(preferences.getInt(HEIGHT, 0)));

                PerformNetworkRequest request = new PerformNetworkRequest(Api.URL_UPDATE_USER_HEIGHT, params, CODE_POST_REQUEST);
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
            Log.v("JESYE ---------------", s);
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

