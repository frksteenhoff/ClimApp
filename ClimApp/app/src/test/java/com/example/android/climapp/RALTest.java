package com.example.android.climapp;

import com.example.android.climapp.wbgt.RecommendedAlertLimit;

import org.junit.Test;

import static junit.framework.Assert.assertEquals;

/**
 * Created by frksteenhoff on 14-05-2018.
 * Testing the values provided when calculating the recommended reference limit
 */

public class RALTest {
    // Activity level
    private String activityLevel;

    // Acclimatization
    private boolean acclimatized = true;

    @Test
    public void testReferenceLimitHigh() {
        activityLevel = "high";
        RecommendedAlertLimit ral = new RecommendedAlertLimit(activityLevel, acclimatized);

        // Check that value 415, which is the corresponding metabolic rate, returns
        // a reference limit of 26 when user is acclimatized
        assertEquals(26, ral.getReferenceLimit());

        // Check that the value is 23 for someone not acclimatized
        ral = new RecommendedAlertLimit(activityLevel, !acclimatized);
        assertEquals(23, ral.getReferenceLimit());
    }

    @Test
    public void testReferenceLimitVeryLow() {
        activityLevel = "very low";
        RecommendedAlertLimit ral = new RecommendedAlertLimit(activityLevel, acclimatized);
        // Check that value 300, which is the corresponding metabolic rate, returns
        // a default reference limit of 333 when user is acclimatized
        assertEquals(33, ral.getReferenceLimit());

        // Check that the value is 32 for someone not acclimatized
        ral = new RecommendedAlertLimit(activityLevel, !acclimatized);
        assertEquals(32, ral.getReferenceLimit());
    }

    @Test
    public void testReferenceLimitLow() {
        activityLevel = "low";
        RecommendedAlertLimit ral = new RecommendedAlertLimit(activityLevel, acclimatized);
        // Check that value 180, which is the corresponding metabolic rate, returns
        // a reference limit of 30 when user is acclimatized
        assertEquals(30, ral.getReferenceLimit());

        // Check that the value is 29 for someone not acclimatized
        ral = new RecommendedAlertLimit(activityLevel, !acclimatized);
        assertEquals(29, ral.getReferenceLimit());

    }

    @Test
    public void testReferenceLimitNull() {
        String[] activityLevels = {null, "medium"};
        for(String al : activityLevels) {
            RecommendedAlertLimit ral = new RecommendedAlertLimit(al, acclimatized);
            // Check that value 300, which is the corresponding metabolic rate, returns
            // a default reference limit of 28 when user is acclimatized
            assertEquals(28, ral.getReferenceLimit());

            // Check that the value is 26 for someone not acclimatized
            ral = new RecommendedAlertLimit(al, !acclimatized);
            assertEquals(26, ral.getReferenceLimit());
        }
    }

    @Test
    public void testRALValue() {
        activityLevel = "medium";
        RecommendedAlertLimit ral = new RecommendedAlertLimit(activityLevel, acclimatized);
        // Check that value 300, which is the corresponding metabolic rate, returns
        // a default reference limit of 28 when user is acclimatized
        assertEquals(25, Math.round(ral.calculateRALValue()));
        assertEquals(20, Math.round(ral.calculateRALValue() * 0.8));
    }
}
