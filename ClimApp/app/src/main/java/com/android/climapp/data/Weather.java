package com.android.climapp.data;

/**
 * @author frksteenhoff
 * Model class for the ClimApp Weather to be pushed to databas.
 */

public class Weather {
    private String _id;
    private String longitude;
    private String latitude;
    private double temperature;
    private double wind_speed;
    private double humidity;
    private double cloudiness;
    private int activity_level;

    public Weather(String _id, String longitude, String latitude, double temperature, double wind_speed, double humidity, double cloudiness, int activity_level){
        this._id = _id;
        this.longitude = longitude;
        this.latitude = latitude;
        this.temperature = temperature;
        this.wind_speed = wind_speed;
        this.humidity = humidity;
        this.cloudiness = cloudiness;
        this.activity_level = activity_level;
    }

    public String getId() {
        return _id;
    }

    public String getLongitude() {
        return longitude;
    }

    public String getLatitude() {
        return latitude;
    }

    public double getTemperature() {
        return temperature;
    }

    public double getWindSpeed() {
        return wind_speed;
    }

    public double getHumidity() {
        return humidity;
    }

    public double getCloudiness() {
        return cloudiness;
    }

    public int getActivityLevel() {
        return activity_level;
    }
}
