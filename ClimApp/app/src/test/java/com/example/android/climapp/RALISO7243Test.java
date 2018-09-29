package com.android.climapp;

import com.android.climapp.wbgt.RecommendedAlertLimitISO7243;

import org.junit.Test;

import static junit.framework.Assert.assertEquals;

/**
 * Created by frksteenhoff on 14-05-2018.
 * Testing the values provided when calculating the recommended reference limit based on ISO 7243
 */

public class RALISO7243Test {
    // Activity level
    private String activityLevel;
    // Height
    private String height = "1.80";
    // Weight
    private int weight = 80;

    @Test
    public void testReferenceLimitHigh() {
        activityLevel = "medium";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        // Check that value 415, which is the corresponding metabolic rate, returns
        // a reference limit of 26 when user is acclimatized
        assertEquals(299, Math.round(ral.getMetabolicRate()));

    }
}
