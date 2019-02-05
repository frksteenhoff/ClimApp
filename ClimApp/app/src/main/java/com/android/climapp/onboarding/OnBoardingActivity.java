package com.android.climapp.onboarding;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentStatePagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.android.climapp.MainActivity;
import com.android.climapp.R;
import com.android.climapp.utils.Utils;
import com.ogaclejapan.smarttablayout.SmartTabLayout;

import static com.android.climapp.utils.ApplicationConstants.AGE;
import static com.android.climapp.utils.ApplicationConstants.AGE_ONBOARDING;
import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_VALUE;
import static com.android.climapp.utils.ApplicationConstants.ONBOARDING_COMPLETE;
import static com.android.climapp.utils.ApplicationConstants.UNIT;
import static com.android.climapp.utils.ApplicationConstants.WEIGHT;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Handling onboarding process for new utils
 * Saving utils preferences on device
 */

public class OnBoardingActivity extends FragmentActivity {

    private ViewPager pager;
    private Button skip;
    private Button next;
    private Utils utils;
    private SharedPreferences preferences;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.onboard_activity);
        pager = findViewById(R.id.pager);
        SmartTabLayout indicator = findViewById(R.id.indicator);
        skip = findViewById(R.id.skip);
        next = findViewById(R.id.next);
        preferences = getSharedPreferences(APP_NAME, MODE_PRIVATE);
        utils = new Utils(preferences);

        // Returning the correct onboarding fragment
        FragmentStatePagerAdapter adapter = new FragmentStatePagerAdapter(getSupportFragmentManager()) {
            @Override
            public Fragment getItem(int position) {
                switch (position) {
                    case 0:
                        return new OnBoardingFragment_Justification();
                    case 1:
                        return new OnBoardingFragment_Units();
                    case 2:
                        return new OnBoardingFragment_Age();
                    case 3:
                        return new OnBoardingFragment_Gender();
                    case 4:
                        return new OnBoardingFragment_Height();
                    case 5:
                        return new OnBoardingFragment_Weight();
                    case 6:
                        return new OnBoardingFragment_Acclimatization();
                    default:
                        return null;
                }
            }
            @Override
            public int getCount() {
                return 7;
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
                finishOnBoardingIncomplete();
            }
        });

        // Handle storage of utils preference input during onboarding
        next.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Justification/first welcome
                // if pager.getCurrentItem() == 0

                // Units
                // if pager.getCurrentItem() == 1
                // Saving gender value done in OnBoardingFragment_Units

                // Age
                if(pager.getCurrentItem() == 2) {
                    EditText currentText = findViewById(R.id.age_as_date_DDMMYYY);
                    if(utils.isWellFormedInputDate(currentText.getText().toString())) {
                        saveDayOfBirth();
                        utils.setDateOfBirth(currentText.getText().toString());
                        preferences.edit().putInt(AGE, utils.getAge()).apply();
                        pager.setCurrentItem(pager.getCurrentItem() + 1);
                    } else {
                        Toast.makeText(getApplicationContext(), R.string.wrong_age, Toast.LENGTH_SHORT).show();
                    }

                    // Gender
                    // if pager.getCurrentItem() == 3
                    // Saving gender value done in OnBoardingFragment_Gender

                    // Height
                } else if(pager.getCurrentItem() == 4) {
                    saveInformation(HEIGHT_VALUE);

                    // Weight
                } else if(pager.getCurrentItem() == 5) {
                    saveInformation(WEIGHT);

                    // Acclimatization (last input parameter)
                } else if (pager.getCurrentItem() == 6) {
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
                if (position == 6) {
                    skip.setVisibility(View.GONE);
                    next.setText(R.string.done);
                } else {
                    skip.setVisibility(View.VISIBLE);
                    next.setText(R.string.next);
                }
            }
        });
    }

    /**
     * Saving utils preferences -- only if input format is correct
     * Age: Correct means max lenght 8, all numbers
     */
    private void saveDayOfBirth() {
        EditText currentText = findViewById(R.id.age_as_date_DDMMYYY);
        preferences.edit().putString(AGE_ONBOARDING, currentText.getText().toString()).apply();
    }

    /**
     * Save onboarding information on weight and height stored in EditText views.
     * Only valid input if any numeric input given
     * @param preferenceName name of preference for which to save data
     */
    private void saveInformation(String preferenceName) {
        if (preferenceName.equals(HEIGHT_VALUE)) {
            EditText inputHeight = findViewById(R.id.set_height);
            String height = inputHeight.getText().toString();

            if (isParsable(height) && isReasonableH(height) && height.contains(".")){
                preferences.edit().putString(preferenceName, height).apply();
                pager.setCurrentItem(pager.getCurrentItem() + 1);
            } else {
                Toast.makeText(getApplicationContext(),
                        R.string.height_boundaries, Toast.LENGTH_SHORT).show();
            }
        } else {
            // Can only be weight, save as SI unit
            EditText inputWeight = findViewById(R.id.set_weight);
            if (inputWeight.getText().toString().length() > 1 && isReasonable(inputWeight.getText().toString())) {
                int unit = preferences.getInt(UNIT, 0);
                int weight = Integer.parseInt(inputWeight.getText().toString());
                preferences.edit().putInt(preferenceName, utils.convertWeightToKgFromUnit(unit, weight)).apply();
                pager.setCurrentItem(pager.getCurrentItem() + 1);
            } else {
                Toast.makeText(getApplicationContext(),
                        R.string.weight_boundaries, Toast.LENGTH_SHORT).show();
            }
        }
    }

    private boolean isReasonableH(String height) {
        int unit = preferences.getInt(UNIT, 0);
        String[] height_values = utils.showCorrectHeightValues(unit);
        double minHeight = Double.parseDouble(height_values[0]);
        double maxHeight = Double.parseDouble(height_values[height_values.length-1]);
        return Double.parseDouble(height) >= minHeight && Double.parseDouble(height) <= maxHeight;
    }

    private boolean isReasonable(String weight) {
        int maxWeight = 350;
        int minWeight = 45;
        int unit = preferences.getInt(UNIT, 0);
                return utils.convertWeightToKgFromUnit(unit, Integer.parseInt(weight)) >= minWeight &&
                        utils.convertWeightToKgFromUnit(unit, Integer.parseInt(weight)) <= maxWeight;
    }

    private boolean isParsable(String input_height) {
        try
        {
            Double.parseDouble(input_height);
        }
        catch(NumberFormatException e)
        {
            return false;
        }
        return true;
    }

    // On boarding steps were not skipped -- might still be incomplete
    private void finishOnBoarding() {
        // Set on_boarding complete to true
        preferences.edit().putBoolean(ONBOARDING_COMPLETE, true).apply();

        // Launch main activity
        Intent main = new Intent(this, MainActivity.class);
        startActivity(main);

        // Close onboarding activity
        finish();
    }

    // On boarding steps were skipped, utils information is incomplete
    private void finishOnBoardingIncomplete() {
        // Set on_boarding complete to true
        preferences.edit().putBoolean(ONBOARDING_COMPLETE, true).apply();

        Toast.makeText(getApplicationContext(),
                R.string.onboarding_not_completed, Toast.LENGTH_LONG)
                .show();

        // Launch main activity
        Intent main = new Intent(this, MainActivity.class);
        startActivity(main);

        // Close onboarding activity
        finish();
    }
}
