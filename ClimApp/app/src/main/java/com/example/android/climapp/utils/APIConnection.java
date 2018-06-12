package com.example.android.climapp.utils;

import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.AsyncTask;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.android.climapp.R;
import com.example.android.climapp.dashboard.DashboardFragment;
import com.example.android.climapp.wbgt.RecommendedAlertLimit;
import com.example.android.climapp.wbgt.Solar;
import com.example.android.climapp.wbgt.SolarRad;
import com.example.android.climapp.wbgt.WBGT;
import com.squareup.picasso.Picasso;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.stream.Collectors;

public class APIConnection extends AsyncTask<String, String, String> {
    /* Key authorizing connection to API */
    private String mAPIKey;

    /* Base url to weather API */
    //private String mtestURL = "http://samples.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s";
    private String mBaseURL = "http://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s";

    /* Longitude/latitude pair */
    private Pair<?, ?> mCoordinatePair;
    /* Calculated string based on input in constructor */
    private String mConnectionString;
    private String pageText;
    private String CHANNEL_ID = "ClimApp";

    // JSON tags
    private static final String TAG_CITY = "name";
    private static final String TAG_MAIN = "main";
    private static final String TAG_WIND = "wind";
    private static final String TAG_WEATHER = "weather";
    private static final String TAG_CLOUDS = "clouds";
    // JSON elements
    private static final String TEMPERATURE = "temp";
    private static final String HUMIDITY = "humidity";
    private static final String TAG_ALL = "all";
    private static final String PRESSURE = "pressure";
    private static final String SPEED = "speed";
    private static final String WEATHER_DESCRIPTION = "description";
    private static final String WEATHER_ID = "id";
    private static final String WEATHER_ICON = "icon";

    private Integer pressure, temperature, cloudiness, weather_id;
    private String city_name, description, icon, mLongitude, mLatitude;
    private double wind_speed, humidity;
    private DashboardFragment mDashboard;

    private SharedPreferences mPreferences;
    private WBGT wbgt;

    /* Only working for creating the needed connection string to
    *  openweathermap.org, others will be implemented later on.
    *  Example with input parameters:
    *  http://openweathermap.org/data/2.5/weather?lat=35&lon=139&appid=b1b15e88fa797225412429c1c50c122a1
    */
    public APIConnection(String apiKey, Pair<?, ?> coordinatePair, SharedPreferences preferences, DashboardFragment dashboard) {
        mAPIKey = apiKey;
        mCoordinatePair = coordinatePair;
        /* Create connection string (URL) */
        mConnectionString = String.format(mBaseURL,
                mCoordinatePair.getLeft(),
                mCoordinatePair.getRight(),
                mAPIKey);
        mPreferences = preferences;
        mLatitude = mCoordinatePair.getLeft().toString();
        mLongitude = mCoordinatePair.getRight().toString();
        mDashboard = dashboard;
    }

    /* Get URL for connection to weather API */
    public String getAPIConnectionString() {
        return mConnectionString;
    }

    public String doInBackground(String... params) {

        URL url = null;
        try {
            url = new URL(getAPIConnectionString());
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) url.openConnection();
        } catch (IOException e) {
            e.printStackTrace();
        }
        try {
            InputStreamReader in = new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8);
            BufferedReader reader = new BufferedReader(in);
            pageText = reader.lines().collect(Collectors.joining("\n"));

        } catch (Exception e1) {
            e1.printStackTrace();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
        return pageText;
    }

    /**
     * When data has been retrieved from Open Weather Map API, extract and show in views
     * @param pageText String to be converted to JSON Object
     */
    protected void onPostExecute(String pageText) {
        // Get data from response JSON Object
        getJSONResponseContent(pageText);

        // Display data in UI
        setDashboardViewContentFromAPIResponse();

        // Calculate WBGT model parameters
        setAndSaveDashboardWBGTModelParameters();

        RecommendedAlertLimit ral = new RecommendedAlertLimit(
                mPreferences.getString("activity_level", null),
                mPreferences.getBoolean("Acclimatization", false));

        String color = ral.getRecommendationColor(mPreferences.getFloat("WBGT", 0), ral.calculateRALValue());

        // Set color in view based on RAL interval
        ImageView recommendationView = mDashboard.getActivity().findViewById(R.id.ral);
        ImageView recommendationSmallView = mDashboard.getActivity().findViewById(R.id.ral_small);

        recommendationView.setColorFilter(Color.parseColor(color));
        recommendationSmallView.setColorFilter(Color.parseColor(color));
    }

    private void getJSONResponseContent(String text) {
        try {
            JSONObject json = new JSONObject(text);

            // Values fetched from API response (JSONObject) humidity, pressure, temperature etc.
            humidity = json.getJSONObject(TAG_MAIN).getInt(HUMIDITY);
            pressure = json.getJSONObject(TAG_MAIN).getInt(PRESSURE);
            temperature = convertKelvinToCelsius(json.getJSONObject(TAG_MAIN).getInt(TEMPERATURE));
            wind_speed = json.getJSONObject(TAG_WIND).getDouble(SPEED);
            cloudiness = json.getJSONObject(TAG_CLOUDS).getInt(TAG_ALL);
            city_name = json.getString(TAG_CITY);
            weather_id = json.getJSONArray(TAG_WEATHER).getJSONObject(0).getInt(WEATHER_ID);
            description = json.getJSONArray(TAG_WEATHER).getJSONObject(0).getString(WEATHER_DESCRIPTION);
            icon = json.getJSONArray(TAG_WEATHER).getJSONObject(0).getString(WEATHER_ICON);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Setting all dashboard content based on Open Weather Map API responses
     */
    private void setDashboardViewContentFromAPIResponse() {
        // Views updated based on data from Open Weather Map
        ImageView weatherImage = mDashboard.getActivity().findViewById(R.id.weather_icon);
        TextView tempTextView = mDashboard.getActivity().findViewById(R.id.temp_value);
        TextView humidityTextView = mDashboard.getActivity().findViewById(R.id.humidity_value);
        TextView windSpeedTextView = mDashboard.getActivity().findViewById(R.id.wind_speed_value);
        TextView cloudinessTextView = mDashboard.getActivity().findViewById(R.id.cloudiness_value);
        TextView cityTextView = mDashboard.getActivity().findViewById(R.id.current_city);

        tempTextView.setText(String.format("%s°", temperature.toString()));
        humidityTextView.setText(String.format("%s %s", humidity, "%"));
        windSpeedTextView.setText(String.format("%s m/s", wind_speed));
        cloudinessTextView.setText(String.format("%s %s", cloudiness, "%"));
        cityTextView.setText(String.format("%s, %s", city_name, description));

        // Fetch weather icon using Open Weather Map API response
        getOWMWeatherIcon(weatherImage);
    }

    private void getOWMWeatherIcon(ImageView weatherImage) {
        String imgURL = String.format("http://openweathermap.org/img/w/%s.png", icon);
        // Set image in view directly from URL with Picasso
        Picasso.with(mDashboard.getActivity().getApplicationContext()).load(imgURL).fit().centerInside().into(weatherImage);
    }

    /**
     * Calculate and set all WBGT model parameters and recommended alert limits
     */
    private void setAndSaveDashboardWBGTModelParameters() {
        wbgt = calculateWBGT(wind_speed, humidity, pressure);
        TextView wbgt_no_solar = mDashboard.getActivity().findViewById(R.id.no_solar);
        TextView wbgt_solar = mDashboard.getActivity().findViewById(R.id.solar);

        wbgt_no_solar.setText(String.format("TWBG No solar: %s", wbgt.getWBGTWithoutSolar()));
        wbgt_solar.setText(String.format("TWBG Solar:       %s", wbgt.getWBGTWithSolar()));
        mPreferences.edit().putFloat("WBGT", (float) wbgt.getWBGTWithoutSolar()).apply();
        mPreferences.edit().putFloat("WBGT_solar", (float) wbgt.getWBGTWithSolar()).apply();

        /*// Send notification if values are outside recommended range
        if (wbgt.getWBGTWithoutSolar() > 21.0 && !notificationSent) {
            setNotificationChannel();
            createNotification(getString(R.string.app_name), getString(R.string.notificationDescription), notificationID);
            preferences.edit().putBoolean("notification_sent", true).apply();
        }*/
    }
/*
        private void setNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Create the NotificationChannel, but only on API 26+ because
                // the NotificationChannel class is new and not in the support library
                CharSequence name = getString(R.string.channel_name);
                String description = getString(R.string.channel_description);
                int importance = NotificationManager.IMPORTANCE_DEFAULT;

                NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
                channel.setDescription(description);
                notificationManager.createNotificationChannel(channel);
            }
        }

        private void createNotification(String title, String description, int notificationID) {
            // Intent to open application when user clicks notification
            Intent open_intent = new Intent(getActivity(), MainActivity.class);
            open_intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent pendingIntent = PendingIntent.getActivity(getActivity(), 0, open_intent, 0);

            // Notification content
            NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(getActivity(), CHANNEL_ID)
                    .setSmallIcon(R.mipmap.climapp_logo3)
                    .setContentTitle(title)
                    .setContentText(description)
                    .setStyle(new NotificationCompat.BigTextStyle()
                            .bigText(description))
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true);
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(getActivity());

            // Send notification
            notificationManager.notify(notificationID, mBuilder.build());
        }*/

    /**
     * Use calculations for the WBGT mode from JTOF together with basic device input:
     * location, date and time and API response
     *
     * @param wind_speed Wind speed in m/s
     * @param humidity   Humidity in percent
     * @param pressure   pressure in ATM
     * @return wbgt object
     */
    private WBGT calculateWBGT(double wind_speed, double humidity, double pressure) {
        Calendar calendar = Calendar.getInstance();
        // Total offset (geographical and daylight savings) from UTC in hours
        int utcOffset = (calendar.get(Calendar.ZONE_OFFSET) +
                calendar.get(Calendar.DST_OFFSET)) / (60 * 60000);
        int avg = 10;
        double Tair = 25;
        double zspeed = 2;
        double dT = 0; //Vertical temp difference
        int urban = 0;

        calendar.setTime(new Date());
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR);
        int min = calendar.get(Calendar.MINUTE);
        calendar.set(year, month, day, hour, min);

        // Precipitation and cloudfraction now depend on data from Open Weather Map
        // cloud fraction is cloudiness in percent divided by 100 to get it as a fraction
        Solar s = new Solar(Double.parseDouble(mLongitude), Double.parseDouble(mLatitude), calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(),
                calendar.get(Calendar.DAY_OF_YEAR),
                cloudiness/100,
                1,
                isItFoggy(weather_id),
                isItRaining(weather_id)); //(solar zenith angle, day no, cloud fraction,
        // cloud type, fog, precipitation)

        // Making all wbgt calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg,
                Double.parseDouble(mLatitude),
                Double.parseDouble(mLongitude),
                sr.solarIrradiation(), pressure, Tair, humidity, wind_speed, zspeed, dT, urban);
        return wbgt;
    }

    /**
     * If weather ID is either "mist" or "fog" the weather is categorized as foggy.
     * @param weather_id ID fetched from Open Weather Map
     * @return boolean value indicating weather it is foggy
     */
    private boolean isItFoggy(Integer weather_id) {
        return (weather_id == 701 || weather_id == 741);
    }

    /**
     * Check whether it is raining based on OWM weather ID
     * @param weather_id weather ID from Open Weather Map
     *                   all ids here:
     *                   https://openweathermap.org/weather-conditions
     * @return true if raining, otherwise false
     */
    private boolean isItRaining(int weather_id) {
        int rainIds[] = {200, 201, 202, 230, 231, 232,
                300, 301, 302, 310, 311, 312, 313, 314, 321,
                500, 501, 502, 503, 504, 511, 520, 521, 522, 531,
                615, 616};
        return Arrays.asList(rainIds).contains(weather_id);
    }

    private int convertKelvinToCelsius(int temperatureInKelvin) {
        return temperatureInKelvin - (int) 273.15;
    }
}