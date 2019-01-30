package com.android.climapp.data;

public class Api {

    private static final String DB_IP = "xx";
    private static final String ROOT_URL = "http://" + DB_IP + "/dummyPHPdir/v1/ClimAppApi.php?apicall=";

    public static final String URL_CREATE_USER = ROOT_URL + "createUser";
    public static final String URL_READ_USERS = ROOT_URL + "getUser";
    public static final String URL_UPDATE_USER = ROOT_URL + "updateUser";
    public static final String URL_DELETE_USER = ROOT_URL + "deleteUser&_id=";
}

