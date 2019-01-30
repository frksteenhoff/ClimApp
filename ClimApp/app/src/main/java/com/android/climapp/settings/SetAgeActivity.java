package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.utils.Utils;

import static com.android.climapp.utils.SharedPreferencesConstants.AGE;
import static com.android.climapp.utils.SharedPreferencesConstants.AGE_ONBOARDING;
import static com.android.climapp.utils.SharedPreferencesConstants.APP_NAME;

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
                Intent parentIntent = NavUtils.getParentActivityIntent(this);
                parentIntent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(parentIntent);
                finish();
                return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
