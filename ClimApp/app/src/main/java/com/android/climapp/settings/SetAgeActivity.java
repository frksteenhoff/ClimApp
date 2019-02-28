package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.data.Api;
import com.android.climapp.data.RequestHandler;
import com.android.climapp.utils.Utils;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

import static com.android.climapp.utils.ApplicationConstants.AGE;
import static com.android.climapp.utils.ApplicationConstants.AGE_ONBOARDING;
import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.CODE_GET_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.CODE_POST_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.DB_AGE;
import static com.android.climapp.utils.ApplicationConstants.DB_ID;
import static com.android.climapp.utils.ApplicationConstants.GUID;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting and displaying the correct utils age
 */

public class SetAgeActivity extends AppCompatActivity {

    static SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private TextView userInputTextView, userCalcAgeTextView;
    private Utils utils;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_age);

        preferences = getSharedPreferences(APP_NAME, MODE_PRIVATE);
        editor = preferences.edit();
        utils = new Utils(preferences);

        userInputTextView = findViewById(R.id.user_input_age);
        userCalcAgeTextView = findViewById(R.id.userAge);
        Button submitAge = findViewById(R.id.submit_age);

        if(preferences.getString(AGE_ONBOARDING, null) != null) {
            userCalcAgeTextView.setText(utils.getAge() + "");
        }

        submitAge.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(utils.isWellFormedInputDate(userInputTextView.getText().toString())) {
                    utils.setDateOfBirth(userInputTextView.getText().toString());
                    userCalcAgeTextView.setText(utils.getAge() + "");
                    editor.putString(AGE_ONBOARDING, userInputTextView.getText().toString());
                    editor.putInt(AGE, utils.getAge()).apply();

                    Toast.makeText(getApplicationContext(), getString(R.string.age_updated)
                            + " " + userCalcAgeTextView.getText().toString(), Toast.LENGTH_SHORT).show();
                } else {
                    //Display the newly selected value from picker
                    Toast.makeText(getApplicationContext(), R.string.wrong_age, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                // Update age in database
                HashMap<String, String> params = new HashMap<>();
                params.put(DB_ID, preferences.getString(GUID, null));
                params.put(DB_AGE, Integer.toString(preferences.getInt(AGE, 0)));

                PerformNetworkRequest request = new PerformNetworkRequest(Api.URL_UPDATE_USER_AGE, params, CODE_POST_REQUEST);
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
                    Toast.makeText(getApplicationContext(), object.getString("message"), Toast.LENGTH_SHORT).show();
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
