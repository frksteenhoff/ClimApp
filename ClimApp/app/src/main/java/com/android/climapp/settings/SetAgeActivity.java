package com.android.climapp.settings;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.utils.User;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting and displaying the correct user age
 */

public class SetAgeActivity extends AppCompatActivity {

    static SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private TextView userInputTextView, userCalcAgeTextView;
    private User user;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_age);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();
        user = new User(preferences);

        userInputTextView = findViewById(R.id.user_input_age);
        userCalcAgeTextView = findViewById(R.id.userAge);
        Button submitAge = findViewById(R.id.submit_age);

        if(preferences.getString("Age_onboarding", null) != null) {
            userCalcAgeTextView.setText(user.getAge() + "");
        }

        submitAge.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(user.isWellFormedInputDate(userInputTextView.getText().toString())) {
                    user.setDateOfBirth(userInputTextView.getText().toString());
                    userCalcAgeTextView.setText(user.getAge() + "");
                    editor.putInt("Age", user.getAge()).apply();

                    Toast.makeText(getApplicationContext(), getString(R.string.age_updated)
                            + " " + userCalcAgeTextView.getText().toString(), Toast.LENGTH_SHORT).show();
                } else {
                    //Display the newly selected value from picker
                    Toast.makeText(getApplicationContext(), R.string.wrong_age, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
