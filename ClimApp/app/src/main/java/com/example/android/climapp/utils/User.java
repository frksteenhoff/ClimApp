package com.example.android.climapp.utils;

import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

/**
 * Created by frksteenhoff on 12-06-2018.
 * Defining the different user parameters
 * Providing methods for setting and getting all values correctly
 */

public final class User {

    private static final User INSTANCE = new User();

    private String mDateOfBirth, mHeight;
    private int mWeight, mUnit;
    private boolean mGender;

    public User() {
        this.mDateOfBirth = "13051988"; // 30 as default
        this.mGender = true;    // True = Female, False = Male
        this.mHeight = "1.70";  // 1.70m as default
        this.mWeight = 90;      // 90kg as default
        this.mUnit = 0;         // 0 SI, 1 US, 2 UK
    }

    public static User getInstance() {
        return INSTANCE;
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
        if(inputDate.length() > 0) {
                int year = Integer.parseInt(inputDate.substring(4));
                int month = Integer.parseInt(inputDate.substring(2, 4));
                int day = Integer.parseInt(inputDate.substring(0, 2));

                return !(inputDate.length() != 8 ||
                        year > Calendar.getInstance().get(Calendar.YEAR) ||
                        (year < (Calendar.getInstance().get(Calendar.YEAR) - 120)) ||
                        month < 0 || month > 11 ||
                        day > 31 || day < 1);
            }
            return false;
    }

    /* Getters and setters */
    public void setDateOfBirth(String DDMMYYYY){mDateOfBirth = DDMMYYYY; }

    public int getAge(){ return calculateAgeFromDate(); }

    public void setHeight(String height){ mHeight = height; }

    public String getHeight(){ return mHeight; }

    public void setWeight(int weight){ mWeight = weight; }

    public int getWeight(){return mWeight; }

    public void setGender(Boolean gender){ mGender = gender; }

    public Boolean getGender(){ return mGender; }

    public void setUnit(int unit){ mUnit = unit; }

    public int getUnit(){ return mUnit; }
}
