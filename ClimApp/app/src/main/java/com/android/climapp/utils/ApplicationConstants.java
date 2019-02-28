package com.android.climapp.utils;

/**
 * @author frksteenhoff
 * Overview of all constants used to store shared preferences
 * NOTE: As the constants play a huge role in the app logic, these should not be changed/refactored
 */
public final class ApplicationConstants {

    private ApplicationConstants() {
    }
    public static final int CODE_GET_REQUEST = 1024; // Value given on get request
    public static final int CODE_POST_REQUEST = 1025; // Value given on post request
    public static final String APP_NAME = "ClimApp";
    public static final String GUID = "user_guid"; // user global unique identifier

    // Default values
    public static final String DEFAULT_HEIGHT = "1.75"; // metres
    public static final int DEFAULT_WEIGHT = 75;        // kilograms
    public static final String DEFAULT_ACTIVITY = "medium";

    // Settings field values
    public static final String ACCLIMATIZATION = "Acclimatization";
    public static final String UNIT = "Unit";
    public static final String GENDER = "gender";
    public static final String AGE = "Age";
    public static final String AGE_ONBOARDING = "Age_onboarding";
    public static final String HEIGHT = "height";
    public static final String HEIGHT_INDEX = "Height_index"; // the index of the user's height i the spinner array
    public static final String HEIGHT_VALUE = "Height_value"; // the value at the height_index
    public static final String WEIGHT = "Weight";
    public static final String NOTIFICATION = "Notification";
    public static final String ACTIVITY_LEVEL = "activity_level";

    // Database fields user
    public static final String DB_ID = "_id";       // user global unique identifier
    public static final String DB_AGE = "age";
    public static final String DB_GENDER = "gender";
    public static final String DB_HEIGHT = "height";
    public static final String DB_WEIGHT = "weight";
    public static final String DB_UNIT = "unit";


    // Database fields weather
    public static final String DB_LONG = "longitude";
    public static final String DB_LAT = "latitude";
    public static final String DB_TEMP = "temperature";
    public static final String DB_WIND = "wind_speed";
    public static final String DB_HUM = "humidity";
    public static final String DB_CLOUD = "cloudiness";
    public static final String DB_ACTIVITY = "activity_level";
    public static final String DB_TEMP_MIN = "temp_min";
    public static final String DB_TEMP_MAX = "temp_max";

    // Database fields feedback


    // Spinner values - clothing
    public static final String FIELD_OF_WORK = "field_of_work";

    // App modes
    public static final String EXPLORE_MODE = "Explore"; // logic currently commented out
    public static final boolean EXPLORE_ENABLED = false; // deciding whether exploration mode is shown
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
