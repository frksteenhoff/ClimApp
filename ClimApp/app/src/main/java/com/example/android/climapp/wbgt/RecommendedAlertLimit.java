package com.example.android.climapp.wbgt;

import java.util.HashMap;

/**
 * Created by frksteenhoff on 14-05-2018.
 * Calculating Recommended Alert Limit
 * RAL [°C-WBGT] = 59.9 − 14.1 log10 M [W]
 *
 * With M calculated from the input provided by the user (activity level) (BSA * met-rate level)
 * W = metabolic rate -- 5 level scale provided in project img folder
 */

public class RecommendedAlertLimit {

    private String activityLevel;
    private boolean acclimatization;
    private HashMap<String, Integer> metabolicRates = new HashMap<String, Integer>()
    {{
        put("very low", 115);
        put("low", 180);
        put("medium", 300);
        put("high", 415);
        put("very high", 520);
    }};

    private HashMap<Integer, Integer> referenceLimitAcclimatized = new HashMap<Integer, Integer>()
    {{
        put(115, 33);
        put(180, 30);
        put(300, 28);
        put(415, 26);
        put(520, 25);
    }};

    private HashMap<Integer, Integer> referenceLimitUnacclimatized = new HashMap<Integer, Integer>()
    {{
        put(115, 32);
        put(180, 29);
        put(300, 26);
        put(415, 23);
        put(520, 20);
    }};

    public RecommendedAlertLimit(String activityLevel, Boolean acclimatization){
        this.activityLevel = activityLevel;
        this.acclimatization = acclimatization;
      }

    /**
     * Getting the metabolic rate based on the users
     * activity level - if the activity level has not been
     * provided by the user, the default moderate metabolic rate
     * is used.
     * @return metabolicRate allowed return type integer
     */
    private int metabolicRateClass() {
        if(activityLevel != null) {
            return metabolicRates.get(activityLevel);
        } else {
            return metabolicRates.get("medium");
        }
    }

    /**
     * THIS MIGHT NOT BE NEEDED AFTER ALL
     * Getting reference limit using the metabolic rate
     * using two different hashmaps dependent on
     * whether user is acclimatized to working environment or not
     * @return value for reference limit.
     */
    public int getReferenceLimit() {
        if(acclimatization) {
            return referenceLimitAcclimatized.get(metabolicRateClass());
        } else {
            return referenceLimitUnacclimatized.get(metabolicRateClass());
        }
    }

    /**
     * Calculate recommended alert limit value
     *  RAL is 59.9 – 14.1*log10(M)
     *  where M is the reference limit
     */
    public double calculateRALValue(){
        return 59.9 - 14.1*Math.log10(metabolicRateClass());
    }
}

