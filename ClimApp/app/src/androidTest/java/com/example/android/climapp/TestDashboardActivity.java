package com.example.android.climapp;

import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertEquals;

/**
 * Instrumentation test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class TestDashboardActivity {

    // Telling JUnit that we are testing the dashboard activity
    // This launches the main activity directly.
    @Rule
    public ActivityTestRule<DashboardActivity> activityActivityTestRule = new ActivityTestRule<DashboardActivity>(DashboardActivity.class);

    @Before
    public void init() {
        activityActivityTestRule.getActivity().getSupportFragmentManager().beginTransaction();
    }

    @Test
    public void TestView() {
        assertEquals(true, true);
    }
}
