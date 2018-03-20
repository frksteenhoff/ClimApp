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
 */

public class OnBoardingActivity extends FragmentActivity {

    private ViewPager pager;
    private SmartTabLayout indicator;
    private Button skip;
    private Button next;

    SharedPreferences preferences;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.onboard_activity);
        pager = (ViewPager) findViewById(R.id.pager);
        indicator = (SmartTabLayout) findViewById(R.id.indicator);
        skip = (Button) findViewById(R.id.skip);
        next = (Button) findViewById(R.id.next);
        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);

        // Returning the correct onboarding fragment
        FragmentStatePagerAdapter adapter = new FragmentStatePagerAdapter(getSupportFragmentManager()) {
            @Override
            public Fragment getItem(int position) {
                switch (position) {
                    case 0:
                        //return new SignUpFragment();
                        return new OnBoardingFragment1();
                    case 1:
                        return new OnBoardingFragment2();
                    case 2:
                        return new OnBoardingFragment3();
                    case 3:
                        return new OnBoardingFragment4();
                    case 4:
                        return new OnBoardingFragment5();
                    case 5:
                        return new OnBoardingFragment6();
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

        next.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(pager.getCurrentItem() == 1) {
                    EditText currentText = (EditText) findViewById(R.id.set_age);
                    // Only add date of birth if correct length
                    if(currentText.length() == 8) {
                        preferences.edit().putString("Age", currentText.toString()).commit();
                        Log.v("HESTE","Added age");
                    }
                    pager.setCurrentItem(pager.getCurrentItem() + 1);
                } else if (pager.getCurrentItem() == 5) {
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
                    next.setText("Done");
                } else {
                    skip.setVisibility(View.VISIBLE);
                    next.setText("Next");
                }
            }
        });
    }
    private void finishOnBoarding() {
        // Get the shared preferences
        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);

        // Set on_boarding complete to true
        preferences.edit().putBoolean("onboarding_complete", true).commit();

        // Launch main activity
        Intent main = new Intent(this, DashboardActivity.class);
        startActivity(main);

        // Close onboarding activity
        finish();
    }
}
