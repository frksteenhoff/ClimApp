package com.android.climapp.utils;

import android.content.SharedPreferences;

import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

/**
 * Created by frksteenhoff on 12-06-2018.
 * Defining the different user parameters
 * Providing methods for setting and getting all values correctly
 */

public final class User {

    private String mDateOfBirth, mHeight;
    private int mWeight, mUnit;

    public User(SharedPreferences preferences) {
        this.mDateOfBirth = preferences.getString("Age_onboarding", null); // 30 as default (should not be hard coded)
        this.mHeight = preferences.getString("height", "1.70");;  // 1.70m as default
        this.mWeight = preferences.getInt("weight", 90);      // 90kg as default
        this.mUnit = preferences.getInt("Unit", 0);         // 0 SI, 1 US, 2 UK
    }

    /**
     * Date of birth given on form "DDMMYYY" converted to years as integer value
     * @return age in year
     */
    private int calculateAgeFromDate() {
        int years = 0;
        int year = Integer.parseInt(mDateOfBirth.substring(4));
        int month = Integer.parseInt(mDateOfBirth.substring(2,4));
        int day = Integer.parseInt(mDateOfBirth.substring(1,2));

        // Users date of birth from input
        Calendar userBirthDay = new GregorianCalendar(year, month, day);
        // Todays date
        Calendar today = new GregorianCalendar();
        today.setTime(new Date());

        years = today.get(Calendar.YEAR) - userBirthDay.get(Calendar.YEAR);
        return years;
    }

    /**
     * Check that input values for year, month and day are correct.
     * Year not greater than current year or less than current year - 120
     * Month not greater than 11 or less than 0 (Java Calendaer is zero-indexed)
     * Day not greater than 31 or less than 1
     * @return true or false indicating whether input date has correct format
     */
    public boolean isWellFormedInputDate(String inputDate) {
        int lowerLimit = 18;
        int upperLimit = 120;
        if(inputDate.length() == 8) {
                int year = Integer.parseInt(inputDate.substring(4));
                int month = Integer.parseInt(inputDate.substring(2, 4));
                int day = Integer.parseInt(inputDate.substring(0, 2));

                return !(year > Calendar.getInstance().get(Calendar.YEAR) - lowerLimit ||
                        (year < (Calendar.getInstance().get(Calendar.YEAR) - upperLimit)) ||
                        month < 0 || month > 11 ||
                        day > 31 || day < 1);
        } else {
            return false;
        }
    }

    /**
     * Fetching correct units array for each of the different unit types
     * @param preferred_unit the integer position associated with the chosen unit
     * @return array of values to show the user when setting his/her height
     */
    public String[] showCorrectHeightValues(int preferred_unit) {
        String units[];
        // If unit chosen is "SI" -- use meters
        if (preferred_unit == 0) {
            units = new String[] {  "1.22", "1.23", "1.24", "1.25", "1.26", "1.27", "1.28", "1.29",
                    "1.30", "1.31", "1.32", "1.33", "1.34", "1.35", "1.36", "1.37", "1.38", "1.39",
                    "1.40", "1.41", "1.42", "1.43", "1.44", "1.45", "1.46", "1.47", "1.48", "1.49",
                    "1.50", "1.51", "1.52", "1.53", "1.54", "1.55", "1.56", "1.57", "1.58", "1.59",
                    "1.60", "1.61", "1.62", "1.63", "1.64", "1.65", "1.66", "1.67", "1.68", "1.69",
                    "1.70", "1.71", "1.72", "1.73", "1.74", "1.75", "1.76", "1.77", "1.78", "1.79",
                    "1.80", "1.81", "1.82", "1.83", "1.84", "1.85", "1.86", "1.87", "1.88", "1.89",
                    "1.90", "1.91", "1.92", "1.93", "1.94", "1.95", "1.96", "1.97", "1.98", "1.99",
                    "2.00", "2.01", "2.02", "2.03", "2.04", "2.05", "2.06", "2.07", "2.08", "2.09",
                    "2.10", "2.11", "2.12", "2.13", "2.14", "2.15", "2.16", "2.17", "2.18", "2.19",
                    "2.20", "2.21", "2.22", "2.23", "2.24", "2.25", "2.26", "2.27", "2.28", "2.29",
                    "2.30"};
            // If unit chosen is "US" or "UK" -- use feet/inches
        } else {
            units = new String[]{   "4.0",  "4.0", "4.1", "4.1", "4.2",  "4.2",  "4.2",  "4.3",
                    "4.3",  "4.4",  "4.4",  "4.4", "4.5", "4.5", "4.6",  "4.6",  "4.6",  "4.7",
                    "4.7",  "4.8",  "4.8",  "4.8", "4.9", "4.9", "4.10", "4.10", "4.10", "4.11",
                    "4.11", "4.11", "5.0",  "5.0", "5.1", "5.1", "5.1",  "5.2",  "5.2",  "5.3",
                    "5.3",  "5.3",  "5.4",  "5.4", "5.5", "5.5", "5.5",  "5.6",  "5.6",  "5.7",
                    "5.7",  "5.7",  "5.8",  "5.8", "5.9", "5.9", "5.9",  "5.10", "5.10", "5.11",
                    "5.11", "5.11", "6.0",  "6.0", "6.0", "6.1", "6.1",  "6.2",  "6.2",  "6.2",
                    "6.3",  "6.3",  "6.4",  "6.4", "6.4", "6.5", "6.5",  "6.6",  "6.6",  "6.6",
                    "6.7",  "6.7",  "6.7",  "6.8", "6.8", "6.9", "6.9",  "6.9",  "6.10", "6.10",
                    "6.11", "6.11", "6.11", "7.0", "7.0", "7.1", "7.1",  "7.1",  "7.2",  "7.2",
                    "7.3",  "7.3",  "7.3",  "7.4", "7.4", "7.5", "7.5",  "7.5",  "7.6",  "7.6",
                    "7.7",};
        }
        return units;
    }

    /**
     * Converting weight from unit kilograms, pounds or stones to kilograms
     * @param preferred_unit integer representation of unit
     * @param weight weight in unit represented by preferred_unit
     * @return integer value of unit mass after conversion
     */
    public int convertWeightToKgFromUnit(int preferred_unit, int weight) {
        double calculatedWeight;
        switch (preferred_unit) {
            case 1:
                calculatedWeight = weight * 0.45359237;
                break;
            case 2:
                calculatedWeight = weight * 6.35029318;
                break;
            default:
                calculatedWeight = weight;
                break;
        }
        return (int) Math.round(calculatedWeight);
    }

    /**
     * Set picker value based on user weigth in correct unit
     * Converting weight from kilograms to pounds or stones (if kg do nothing)
     * @param preferred_unit integer representation of chosen unit (UK/US metric system)
     * @param weight weight in kilos to convert to unit represented by preferred_unit
     * @return integer value of unit mass after conversion
     */
    public int convertWeightToUnitFromKg(int preferred_unit, int weight){
        double calculatedWeight;
        switch (preferred_unit) {
            case 1:
                calculatedWeight = weight * 2.20462262;
                break;
            case 2:
                calculatedWeight = weight * 0.157473044;
                break;
            default:
                calculatedWeight = weight;
                break;
        }
        return (int) Math.round(calculatedWeight);
    }

    public void findClosestIndexValue(String height_value, String[] height_units, SharedPreferences preferences) {
        int idx = 0;
        while(Double.parseDouble(height_units[idx]) < Double.parseDouble(height_value)
                && idx < height_units.length-1) {
            idx++;
        }

        if(idx-1 < height_units.length) {
            preferences.edit().putInt("Height_index", idx).apply();
        }
    }

    /**
     * Based on user preferences, the temperature is set in either Celcius or Fahrenheit
     * @param inputTemperature temperature in kelvin
     * @return the temperature in either fahrenheit or celcius based on user preference
     */
    public int setCorrectTemperatureUnit(int inputTemperature, int  unit){
        if(unit == 1){
            return convertKelvinToFahrenheit(inputTemperature);
        } else {
            return convertKelvinToCelsius(inputTemperature);
        }
    }

    /**
     * T(°C) = T(K) - 273.15
     * @param temperatureInKelvin the temperature in kelvin
     * @return the input temperature in kelvin converted to fahrenheit
     */
    private int convertKelvinToCelsius(int temperatureInKelvin) {
        return temperatureInKelvin - (int) 273.15;
    }

    /**
     * T(°F) = T(K) × 1.8 - 459.67
     * @param temperatureInKelvin the temperature in kelvin
     * @return the input temperature in kelvin converted to fahrenheit
     */
    private int convertKelvinToFahrenheit(int temperatureInKelvin){
        return (int) Math.round((temperatureInKelvin * 1.8) - 459.67);
    }

    /* Getters and setters */
    public void setDateOfBirth(String DDMMYYYY){this.mDateOfBirth = DDMMYYYY; }

    public int getAge(){ return calculateAgeFromDate(); }

    public void setHeight(String height){ mHeight = height; }

    public String getHeight(){ return mHeight; }

    public void setWeight(int weight){ mWeight = weight; }

    public int getWeight(){return mWeight; }

    public void setUnit(int unit){ mUnit = unit; }

    public int getUnit(){ return mUnit; }
}
