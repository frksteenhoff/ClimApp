package com.android.climapp.wbgt;

import java.util.HashMap;

/**
 * Created by frksteenhoff on 14-05-2018.
 * Calculating Recommended Alert Limit
 * RAL [°C-WBGT] = 59.9 − 14.1 log10 M [W]
 *
 * With M calculated from the input provided by the user (activity level, height and weight)
 * M = BSA * physical activity level * 50
 * physical activity level = 1-5, one being low, 5 being high.
 */

public class RecommendedAlertLimitISO7243 {

    private String activityLevel, height;
    private boolean acclimatization;
    private int weight;
    private HashMap<String, Integer> ISOLevel = new HashMap<String, Integer>()
    {{
        put("very low", 1);
        put("low", 2);
        put("medium", 3);
        put("high", 4);
        put("very high", 5);
    }};

    protected RecommendedAlertLimitISO7243() {
        // Exists only to defeat instantiation.
    }

    public RecommendedAlertLimitISO7243(String activityLevel, String height, int weight){
        this.activityLevel = activityLevel;
        this.weight = weight;
        this.height = height;
      }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    /**
     * Getting the metabolic rate based on the users
     * activity level - if the activity level has not been
     * provided by the user, the default moderate metabolic rate
     * is used.
     * @return metabolicRate allowed return type integer
     */
    private int getISOLevel() {
        return ISOLevel.get(activityLevel);
    }

    /**
     * Calculate recommended alert limit value
     *  RAL is 59.9 – 14.1*log10(M)
     *  where M is the reference limit
     */
    public double calculateRALValue(){
        return 59.9 - 14.1 * Math.log10(getMetabolicRate());
    }

    public double getMetabolicRate() {
        return getBodySurfaceArea(height, weight) * getISOLevel() * 50;
    }

    /**
     * Calculating the body surface area using height and weight of user calculated as:
     * BSA = (height (m))^0.725 * 0.20247 * weight (kg)^0.425
     *
     * @param inputHeight user's height in meters 1.80 as default
     * @param inputWeight user's weight in kilograms 80 as default
     * @return the user's body surface area
     * Using default values for height and/or weight if user has not already input a value.
     */
    private double getBodySurfaceArea(String inputHeight, int inputWeight) {
        double BSA = Math.pow((Double.parseDouble(inputHeight)), 0.725) * 0.20247 * Math.pow(inputWeight, 0.425);
        return BSA;
    }

    /**
     * Set indicator (red/green/yellow) based on recommended alert limit on dashboard view
     * green    if wbgt <= 0.8 * ral
     * yellow   if wbgt >  0.8 * ral and
     *             wbgt <  ral
     * red      if wbgt >  ral and
     *             wbgt <  ral * 1.2
     * dark red if wbgt >= ral * 1.2
     * @param WBGTin WBGT value (with or without solar)
     * @param RAL RAL value - reference limit
     */
    public String getRecommendationColor(double WBGTin, double RAL) {
        long WBGT = Math.round(WBGTin);

        if(WBGT <= Math.round(0.8 * RAL)) {
            return "#00b200"; // Green
        } else if(Math.round(0.8 * RAL) < WBGT && WBGT < RAL) {
            return "#FBBA57"; // Orange
        } else if (RAL < WBGT && WBGT < RAL * 1.2 ){
            return "#e50000"; // Red
        } else {
            return "#b20000"; // Dark red
        }
    }
}

