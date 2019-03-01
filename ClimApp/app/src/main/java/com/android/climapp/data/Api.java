package com.android.climapp.data;

/**
 * @author frksteenhoff
 * CRUD Operations allowed from the app on the database
 *
 * All information here reflects that implemented on the ClimApp server side API
 * more information here:
 * - https://github.com/frksteenhoff/ClimApp/wiki/Database-API
 *
 * Changes here will only be valid if they are in compliance with these.
 */
public class Api {

    // IP address of the ClimApp database server
    private static final String DB_IP = "192.38.64.244";
    private static final String ROOT_URL = "http://" + DB_IP + "/ClimAppAPI/v1/ClimAppApi.php?apicall=";

    // USER RELATED
    public static final String URL_CREATE_USER = ROOT_URL + "createUserRecord";
    public static final String URL_READ_USERS = ROOT_URL + "getUsers";
    public static final String URL_UPDATE_USER = ROOT_URL + "updateUser";
    public static final String URL_UPDATE_USER_AGE = ROOT_URL + "updateUserAge";
    public static final String URL_UPDATE_USER_GENDER = ROOT_URL + "updateUserGender";
    public static final String URL_UPDATE_USER_HEIGHT = ROOT_URL + "updateUserHeight";
    public static final String URL_UPDATE_USER_WEIGHT = ROOT_URL + "updateUserWeight";
    public static final String URL_UPDATE_USER_UNIT = ROOT_URL + "updateUserUnit";
    public static final String URL_DELETE_USER = ROOT_URL + "deleteUser&_id=";

    // WEATHER RELATED
    public static final String URL_ADD_WEATHER_INFO = ROOT_URL + "createWeatherRecord";
    public static final String URL_GET_WEATHER_INFO = ROOT_URL + "getWeather";

    // FEEDBACK RELATED
    public static final String URL_ADD_FEEDBACK = ROOT_URL + "createFeedbackRecord";
    public static final String URL_GET_FEEDBACK = ROOT_URL + "getFeedback";
}

