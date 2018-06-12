package com.example.android.climapp.settings;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.example.android.climapp.R;
import com.example.android.climapp.utils.User;

/**
 * Created by frksteenhoff on 21-01-2018.
 * Setting and displaying the correct user age
 */

public class SetAgeActivity extends AppCompatActivity {

    static SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private TextView userInputTextView, userCalcAgeTextView;
    private User user = User.getInstance();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_age);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        userInputTextView = findViewById(R.id.user_input_age);
        userCalcAgeTextView = findViewById(R.id.userAge);
        userCalcAgeTextView.setText(user.getAge() + "");
        Button submitAge = findViewById(R.id.submit_age);

        // Get user age from birth date
        if (preferences.getString("Age_onboarding", null) != null &&
                preferences.getString("Age", null) == null) {
            user.setDateOfBirth(preferences.getString("Age_onboarding", null));
            userCalcAgeTextView.setText(user.getAge());
        }

        submitAge.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(user.isWellFormedInputDate(userInputTextView.getText().toString())) {
                    user.setDateOfBirth(userInputTextView.getText().toString());
                    userCalcAgeTextView.setText(user.getAge() + "");
                    editor.putString("Age",user.getAge()+"").apply();
                } else {
                    //Display the newly selected value from picker
                    Toast.makeText(getApplicationContext(), R.string.wrong_age, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
