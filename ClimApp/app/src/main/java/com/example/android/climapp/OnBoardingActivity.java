package com.example.android.climapp;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentStatePagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.ogaclejapan.smarttablayout.SmartTabLayout;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Handling onboarding process for new user
 * Saving user preferences on device
 */

public class OnBoardingActivity extends FragmentActivity {

    private ViewPager pager;
    private Button skip;
    private Button next;

    private SharedPreferences preferences;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.onboard_activity);
        pager = findViewById(R.id.pager);
        SmartTabLayout indicator = findViewById(R.id.indicator);
        skip = findViewById(R.id.skip);
        next = findViewById(R.id.next);
        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);

        // Returning the correct onboarding fragment
        FragmentStatePagerAdapter adapter = new FragmentStatePagerAdapter(getSupportFragmentManager()) {
            @Override
            public Fragment getItem(int position) {
                Log.v("HESTE", "position:" + position);
                switch (position) {
                    case 0:
                        return new OnBoardingFragment_Units();
                    case 1:
                        return new OnBoardingFragment_Age();
                    case 2:
                        return new OnBoardingFragment_Gender();
                    case 3:
                        return new OnBoardingFragment_Height();
                    case 4:
                        return new OnBoardingFragment_Weight();
                    case 5:
                        return new OnBoardingFragment_Acclimatization();
                    default:
                        return null;
                }
            }

            @Override
            public int getCount() {
                return 6;
            }
        };

        // Associating adapter with viewpager
        pager.setAdapter(adapter);
        // point to smarttablayout by calling setviewpager
        indicator.setViewPager(pager);

        // onClickListeners
        skip.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finishOnBoarding();
            }
        });

        // Handle storage of user preference input during onboarding
        next.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Units
                // if pager.getCurrentItem() == 0
                // Saving gender value done in OnBoardingFragment_Units

                // Age
                if(pager.getCurrentItem() == 1) {
                    saveDayOfBirth();
                    pager.setCurrentItem(pager.getCurrentItem() + 1);

                    // Gender
                    // if pager.getCurrentItem() == 2
                    // Saving gender value done in OnBoardingFragment_Gender

                    // Height
                } else if(pager.getCurrentItem() == 3) {
                    saveInformation("Height");
                    pager.setCurrentItem(pager.getCurrentItem() + 1);

                    // Weight
                } else if(pager.getCurrentItem() == 4) {
                    saveInformation("Weight");
                    pager.setCurrentItem(pager.getCurrentItem() + 1);

                    // Acclimatization (last input parameter)
                } else if (pager.getCurrentItem() == 5) {
                    // Saving acclimatization yes/no done in OnBoardingFragment_Acclimatization
                    finishOnBoarding();

                } else {
                    // Increment counter for the current on boarding screen
                    pager.setCurrentItem(pager.getCurrentItem() + 1);
                }
            }
        });

        // Set text on onboarding screens according to process
        indicator.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener() {
            @Override
            public void onPageSelected(int position) {
                if (position == 5) {
                    skip.setVisibility(View.GONE);
                    next.setText(R.string.skip);
                } else {
                    skip.setVisibility(View.VISIBLE);
                    next.setText(R.string.next);
                }
            }
        });
    }


    /**
     * Saving user preferences -- only if input format is correct
     * Age: Correct means max lenght 8, all numbers
     */
    private void saveDayOfBirth() {
        EditText currentText = findViewById(R.id.set_age);
        // Only add date of birth if correct format
        if (currentText.length() == 8) {
            preferences.edit().putString("Age_onboarding", currentText.getText().toString()).apply();
        }
    }

    /**
     * Save onboarding information on weight and height stored in EditText views.
     * Only valid input if any numeric input given
     */
    private void saveInformation(String preferenceName) {
        if (preferenceName.equals("Height")) {
            EditText inputHeight = findViewById(R.id.set_height);

            Log.v("HESTE", "HERE:" +inputHeight.getText().toString());
            if (inputHeight.getText().toString().length() > 1){
                preferences.edit().putInt(preferenceName, Integer.parseInt(inputHeight.getText().toString())).apply();
            }
        } else {
            // Can only be weight
            EditText inputWeight = findViewById(R.id.set_weight);
            if (inputWeight.getText().toString().length() > 1) {
                preferences.edit().putInt(preferenceName, Integer.parseInt(inputWeight.getText().toString())).apply();
            }
        }
    }

    private void finishOnBoarding() {
        // Set on_boarding complete to true
        preferences.edit().putBoolean("onboarding_complete", true).apply();

        // Launch main activity
        Intent main = new Intent(this, MainActivity.class);
        startActivity(main);

        // Close onboarding activity
        finish();
    }
}
