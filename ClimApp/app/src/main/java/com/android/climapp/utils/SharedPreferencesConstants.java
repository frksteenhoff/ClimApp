package com.android.climapp.utils;

/**
 * @author frksteenhoff
 * Overview of all constants used to store shared preferences
 * NOTE: As the constants play a huge role in the app logic, these should not be changed/refactored
 */
public final class SharedPreferencesConstants {

    private SharedPreferencesConstants() {
    }

    public static final String APP_NAME = "ClimApp";
    public static final String GUID = "user_guid"; // user global unique identifier

    // Settings values
    public static final String ACCLIMATIZATION = "Acclimatization";
    public static final String UNIT = "Unit";
    public static final String GENDER = "gender";
    public static final String AGE = "Age";
    public static final String AGE_ONBOARDING = "Age_onboarding";
    public static final String HEIGHT = "height";
    public static final String HEIGHT_INDEX = "Height_index";
    public static final String HEIGHT_VALUE = "Height_value";
    public static final String WEIGHT = "Weight";
    public static final String NOTIFICATION = "Notification";
    public static final String ACTIVITY_LEVEL = "activity_level";

    public static final String DEFAULT_HEIGHT = "1.75"; // metres
    public static final int DEFAULT_WEIGHT = 75;        // kilograms

    // Spinner values - clothing
    public static final String FIELD_OF_WORK = "field_of_work";

    // App modes
    public static final String EXPLORE_MODE = "Explore"; // logic currently commented out

    // Flags
    public static final String ONBOARDING_COMPLETE = "onboarding_complete";

    // Screen names
    public static final String SETTINGS = "Settings";
    public static final String DASHBOARD = "Dashboard";
    public static final String CLOTHING = "Clothing"; // page currently not in use

    // Model values
    public static final String WBGT_VALUE = "WBGT";
    public static final String TEMPERATURE_STR = "temperature";

    // Recommendation colors
    public static final String COLOR_GREEN = "#00b200";
    public static final String COLOR_ORANGE = "#FBBA57";
    public static final String COLOR_RED = "#e50000";
    public static final String COLOR_DARKRED = "#b20000";
    public static final String COLOR_PLAIN = "#EDE8E6";


}
