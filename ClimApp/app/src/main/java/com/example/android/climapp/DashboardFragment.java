package com.example.android.climapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v7.widget.CardView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.example.android.climapp.wbgt.Solar;
import com.example.android.climapp.wbgt.SolarRad;
import com.example.android.climapp.wbgt.WBGT;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.stream.Collectors;

import static android.content.Context.NOTIFICATION_SERVICE;


/**
 * Created by frksteenhoff
 *
 *  * WBGT model calculations with weather input from combination of
 * Open Weather Map and device's location.
 *
 * WBGT model calculations with weather input from combination of
 * Open Weather Map and device's location.
 *
 * Some of the code snippets/methods related to getting the device's location
 * is based on the tutorial and code made by AndroidHive:
 * https://www.androidhive.info/2015/02/android-location-api-using-google-play-services/
 *
 * The Android Developer tutorial at has also been used as reference:
 * https://developer.android.com/training/location/retrieve-current.html
 *
 * The methods/techniques used from these sources have been credited accordingly with a comment in
 * the related documentation.
 */
public class DashboardFragment extends Fragment implements GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

    public DashboardFragment() {
        // Required empty constructor
    }

    private static final int MY_PERMISSIONS_REQUEST_LOCATION = 0;
    private final static int PLAY_SERVICES_RESOLUTION_REQUEST = 1000;
    private String CHANNEL_ID = "ClimApp";

    // Google client to interact with Google API
    private GoogleApiClient mGoogleApiClient;

    // Location API
    private LocationRequest mLocationRequest;
    private FusedLocationProviderClient mFusedLocationClient;
    private NotificationManager notificationManager;

    // Location updates intervals in sec
    private static int UPDATE_INTERVAL = 10000; // 10 sec
    private static int FATEST_INTERVAL = 5000; // 5 sec
    private static int DISPLACEMENT = 10; // 10 meters

    // Views and buttons
    private Button mLocationButton;
    private ToggleButton activityVeryHigh, activityHigh, activityMedium, activityLow, activityVeryLow;
    private TextView txtLong, txtLat, locationErrorTxt, activityLevelDescription, wbgt_solar, wbgt_no_solar,
            cityTextView, tempTextView, humidityTextView, windSpeedTextView, cloudinessTextView,
            dismissWarningtextView;
    private CardView warningCardView;

    private String latitude, longitude;
    private SharedPreferences preferences;
    private int notificationID = 1;
    private boolean notificationSent;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.dashboard_layout, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        /*Toolbar toolbar = (Toolbar) v.findViewById(R.id.toolbar);
        ((AppCompatActivity)getActivity()).setSupportActionBar(toolbar);*/

        preferences = this.getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(getActivity());

        // Notification view and logic components
        notificationManager = (NotificationManager) getActivity().getSystemService(NOTIFICATION_SERVICE);
        notificationSent = preferences.getBoolean("notification_sent", false);
        warningCardView = getActivity().findViewById(R.id.warning_view);
        dismissWarningtextView = getActivity().findViewById(R.id.dismiss_warning);

        // Activity level buttons
        activityVeryLow = getActivity().findViewById(R.id.dash_toggle_very_low);
        activityLow = getActivity().findViewById(R.id.dash_toggle_low);
        activityMedium = getActivity().findViewById(R.id.dash_toggle_medium);
        activityHigh = getActivity().findViewById(R.id.dash_toggle_high);
        activityVeryHigh = getActivity().findViewById(R.id.dash_toggle_very_high);
        activityLevelDescription = getActivity().findViewById(R.id.activity_description_view);

        // Location view references, updated based on device's location
        mLocationButton = getActivity().findViewById(R.id.locationButton);
        txtLong = getActivity().findViewById(R.id.long_coord);
        txtLat = getActivity().findViewById(R.id.lat_coord);

        // WBGT views
        locationErrorTxt = getActivity().findViewById(R.id.error_txt);
        wbgt_solar = getActivity().findViewById(R.id.solar);
        wbgt_no_solar = getActivity().findViewById(R.id.no_solar);

        // Views updated based on data from Open Weather Map
        tempTextView = getActivity().findViewById(R.id.temp_value);
        humidityTextView = getActivity().findViewById(R.id.humidity_value);
        windSpeedTextView = getActivity().findViewById(R.id.wind_speed_value);
        cloudinessTextView = getActivity().findViewById(R.id.cloudiness_value);
        cityTextView = getActivity().findViewById(R.id.current_city);

        // Check whether onboarding has been completed
        // if onboarding steps still missing, start onboarding
        // Otherwise, check location permission and connect to openweathermap
        if(!onBoardingCompleted()) {
            startOnBoarding();

        } else {
            // Check whether app har permission to access location
            // If access granted, display location.
            // Otherwise prompt user for location settings change
            Log.v("HESTE", "DEVICE HAVE LOCATION ACCESS: " + deviceHasLocationPermission());
            if(deviceHasLocationPermission()) {
                displayLocation();

                // Check availability of play services -- only if location access is granted
                if (checkPlayServices()) {
                    // Building the GoogleApi client
                    buildGoogleApiClient();
                    createLocationRequest();
                }
            } else {
                promptUserForLocationSettingsChange();
            }
        }

        /*
        // Attach navigation drawer
        DrawerLayout drawer = (DrawerLayout) v.findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                getActivity(), drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();

        NavigationView navigationView = (NavigationView) v.findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
        */

        /* Listeners within dashboard views */
        dismissWarningtextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                warningCardView.setVisibility(View.GONE);
            }
        });

        activityVeryLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(activityVeryLow.isChecked()) {
                    updateActivityLevelView(activityVeryLow, "very low", getString(R.string.activity_very_low_text));
                } else {
                    setUncheckedColors(activityVeryLow);
                }
            }
        });

        activityLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(activityLow.isChecked()) {
                    updateActivityLevelView(activityLow, "low", getString(R.string.activity_low_text));
                } else {
                    setUncheckedColors(activityLow);
                }
            }
        });

        activityMedium.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(activityMedium.isChecked()) {
                    updateActivityLevelView(activityMedium, "medium", getString(R.string.activity_medium_text));
                } else {
                    setUncheckedColors(activityMedium);
                }
            }
        });

        activityHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(activityHigh.isChecked()) {
                    updateActivityLevelView(activityHigh, "high", getString(R.string.activity_high_text));
                } else {
                    setUncheckedColors(activityHigh);
                }
            }
        });

        activityVeryHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(activityVeryHigh.isChecked()) {
                    updateActivityLevelView(activityVeryHigh, "very high", getString(R.string.activity_very_high_text));
                } else {
                    setUncheckedColors(activityVeryHigh);
                }
            }
        });

        // L    ocation button click listener
        mLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                displayLocation();
            }
        });

        // Set activity level if checked
        setCheckedActivityLevel();
    }

    /**
     * On app start, set activity level to last value or medium if none.
     */
    private void setCheckedActivityLevel() {
        String activityLevel = preferences.getString("activity_level", null);
        if (activityLevel != null) {
            Log.v("HESTE", "ACTIVITY LEVEL: " + activityLevel);
            switch (activityLevel) {
                case "very low":
                    activityVeryLow.setChecked(true);
                    break;
                case "low":
                    activityLow.setChecked(true);
                    break;
                case "high":
                    activityHigh.setChecked(true);
                    break;
                case "very high":
                    activityVeryHigh.setChecked(true);
                    break;
                default:
                    activityMedium.setChecked(true);
                    break;
            }
        } else {
            preferences.edit().putString("activity_lvel", "medium").apply();
            activityMedium.setChecked(true);
        }
    }

    /**
     * Update views and description of activity level when clicking on any of the activity level toggle buttons
     * @param currentButton identifier of the pressed button
     * @param preferenceText the string value identifying the activity level of the pressed button
     *                       to save in shared preferences
     * @param activityDescription the activity level description for the pressed button
     */
    private void updateActivityLevelView(ToggleButton currentButton, String preferenceText, String activityDescription) {
        // Set all views to false, afterwards: update only the one clicked to true
        activityVeryLow.setChecked(false);
        activityLow.setChecked(false);
        activityMedium.setChecked(false);
        activityHigh.setChecked(false);
        activityVeryHigh.setChecked(false);
        currentButton.setChecked(true);

        // Set the rest of the parameters
        activityLevelDescription.setText(activityDescription);
        setOnCheckedColors(currentButton);
        preferences.edit().putString("activity_level", preferenceText).apply();
    }

    private void setUncheckedColors(ToggleButton toggleButtonId) {
        toggleButtonId.setBackgroundColor(Color.WHITE);
        toggleButtonId.setTextColor(Color.GRAY);

    }

    private void setOnCheckedColors(ToggleButton toggleButtonId) {
        toggleButtonId.setBackgroundColor(getResources().getColor(R.color.colorPrimary));
        toggleButtonId.setTextColor(Color.WHITE);
    }

    private void startOnBoarding() {
        // Start onboarding activity
        Intent onBoarding = new Intent(getActivity(), OnBoardingActivity.class);
        startActivity(onBoarding);

        // Close main activity
        getActivity().finish();
    }

    /**
     * If user have not setup location permission for app
     * prompt user for update -- result in callback method.
     */
    private void promptUserForLocationSettingsChange() {
        // Request the needed permission
        ActivityCompat.requestPermissions(getActivity(),
                new String[]{android.Manifest.permission.ACCESS_COARSE_LOCATION},
                MY_PERMISSIONS_REQUEST_LOCATION);
    }

    /**
     * The callback when user is promted to grant permission to access
     * device's location.
     * @param requestCode
     * @param permissions array of permissions
     * @param grantResults result, whether permission is granted or not
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case MY_PERMISSIONS_REQUEST_LOCATION: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // permission was granted, fetch location
                    displayLocation();

                    // Check availability of play services
                    if (checkPlayServices()) {
                        // Building the GoogleApi client
                        buildGoogleApiClient();
                        createLocationRequest();
                    }

                } else {
                    // permission denied
                    locationErrorTxt.setText(R.string.permission_denied);
                }
                return;
            }
            // 'case' lines to check for other permissions.
        }
    }

    /**
     * Checks whether user has allowed the application to get device's location.
     * @return true if access to device location is granted, false otherwise.
     */
    private boolean deviceHasLocationPermission() {
        return !(ActivityCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(),
                        android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED);
    }

    /**
     * Check whether onboarding has been completed
     * @return true if onboarding completed, false otherwise
     */
    private boolean onBoardingCompleted() {
        return preferences.getBoolean("onboarding_complete", false);
    }

    /**
     * Method to display the location in UI
     * Based on code from AndroidHive and Android Developer, heavily edited.
     * */
    private void displayLocation() {

        if (ActivityCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.v("HESTE", "Access not granted.");
        }
        mFusedLocationClient.getLastLocation()
                .addOnSuccessListener(getActivity(), new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        Log.v("HESTE", location+"");
                        if (location != null) {
                            setLocationViewVisibility(true);

                            // Make lat lon coordinates format, two decimal places
                            DecimalFormat df2 = new DecimalFormat(".##");

                            // Logic to get lat/lon from location object
                            latitude = df2.format(location.getLatitude());
                            longitude = df2.format(location.getLongitude());

                            // Update view components
                            txtLong.setText(latitude);
                            txtLat.setText(longitude);

                            // Connect to weather API openweathermap.com using location coordinates
                            getOpenWeatherMapData(new Pair<String, String>(latitude, longitude));

                        } else {
                            setLocationViewVisibility(false);

                            // Show error message
                            locationErrorTxt.setText(R.string.location_error_text);
                        }
                    }
                });
    }

    /**
     * With device's location, fetch weather data from OpeanWeatherMap.com
     * @param Coordinates lat/lon pair of location coordinates fetched from device
     */
    private void getOpenWeatherMapData(Pair<String, String> Coordinates) {
        APIConnection APIConn = new APIConnection("f22065144b2119439a589cbfb9d851d3", Coordinates);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
        APIConn.execute();
    }

    /**
     * Set correct UI components according to whether location
     * permission has been granted by user or not.
     * If permission, show coordinates, no error message
     * If not permission, show error message, no coordinates.
     * @param locationFound boolean value determining how the dashboard view should look
     */
    private void setLocationViewVisibility(boolean locationFound) {
        if(locationFound) {
            locationErrorTxt.setVisibility(View.GONE);
            txtLat.setVisibility(View.VISIBLE);
            txtLong.setVisibility(View.VISIBLE);
        } else {
            locationErrorTxt.setVisibility(View.VISIBLE);
            txtLat.setVisibility(View.GONE);
            txtLong.setVisibility(View.GONE);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (mGoogleApiClient != null) {
            mGoogleApiClient.connect();
        }
        displayLocation();
    }

    /**
     * When app is resumed, check that permission is given
     * Based on code made by AndroidHive and Android Developer
     */
    @Override
    public void onResume() {
        super.onResume();
        checkPlayServices();
        if (ActivityCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(),
                        android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            displayLocation();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onStop() {
        super.onStop();
       /* if (mGoogleApiClient.isConnected()) {
            mGoogleApiClient.disconnect();
        }*/
    }

    /**
     * Based on code from AndroidHive, edited.
     * @param location updating location when user changes location
     */
/*    @Override
    public void onLocationChanged(Location location) {
        double lat = location.getLatitude();
        double lng = location.getLongitude();
        txtLong.setText(String.valueOf(lng));
        txtLat.setText(String.valueOf(lat));
    }*/

    /**
     * Creating location request object
     * Code added as originally made by AndroidHive
     * */
    protected void createLocationRequest() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setInterval(UPDATE_INTERVAL);
        mLocationRequest.setFastestInterval(FATEST_INTERVAL);
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        mLocationRequest.setSmallestDisplacement(DISPLACEMENT);
    }

    /**
     * Creating google api client object
     * Code added as originally made by AndroidHive
     * */
    protected synchronized void buildGoogleApiClient() {
        mGoogleApiClient = new GoogleApiClient.Builder(getActivity())
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API).build();
    }

    /**
     * Method to verify google play services on the device
     * Code added as originally made by AndroidHive
     * */
    private boolean checkPlayServices() {
        int resultCode = GooglePlayServicesUtil
                .isGooglePlayServicesAvailable(getActivity());
        if (resultCode != ConnectionResult.SUCCESS) {
            if (GooglePlayServicesUtil.isUserRecoverableError(resultCode)) {
                GooglePlayServicesUtil.getErrorDialog(resultCode, getActivity(),
                        PLAY_SERVICES_RESOLUTION_REQUEST).show();
            } else {
                Toast.makeText(getActivity().getApplicationContext(),
                        "This device is not supported.", Toast.LENGTH_LONG)
                        .show();
            }
            return false;
        }
        return true;
    }
/*
    @Override
    public void onStatusChanged(String s, int i, Bundle bundle) {

    }

    @Override
    public void onProviderEnabled(String s) {

    }

    @Override
    public void onProviderDisabled(String s) {

    }
*/
    /**
     * Google api callback methods
     * Based on code made by AndroidHive, edited.
     */
    public void onConnectionFailed(ConnectionResult result) {
        Log.i("HESTE", "Connection failed: ConnectionResult.getErrorCode() = "
                + result.getErrorCode());
    }

    /**
     * Based on code made by AndroidHive
     * @param bundle Bundle of data provided to clients by Google Play services, not used
     */
    @Override
    public void onConnected(Bundle bundle) {
        // Once connected with google api, get the location
        displayLocation();
    }

    /**
     * Based on code made by androidHive
     * @param cause The reason for the disconnection. Defined by constants CAUSE_*
     */
    @Override
    public void onConnectionSuspended(int cause) {
        mGoogleApiClient.connect();
    }

    // TODO: refactor such that APIConnection is in it's own class
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

        // JSON Node names
        private static final String TAG_MAIN = "main";
        private static final String TAG_WIND = "wind";
        private static final String TAG_WEATHER = "weather";
        private static final String TAG_CLOUDS = "clouds";
        private static final String TAG_TEMPERATURE = "temp";
        private static final String TAG_HUMIDITY = "humidity";
        private static final String TAG_ALL = "all";
        private static final String TAG_PRESSURE = "pressure";
        private static final String TAG_SPEED = "speed";
        private static final String TAG_DESCRIPTION = "description";
        private static final String TAG_CITY = "name";

        private Integer pressure, temperature, cloudiness;
        private String city_name, description;
        private double wind_speed, humidity;

        private JSONObject json;
        private WBGT wbgt;

        /* Only working for creating the needed connection string to
        *  openweathermap.org, others will be implemented later on.
        *  Example with input parameters:
        *  http://openweathermap.org/data/2.5/weather?lat=35&lon=139&appid=b1b15e88fa797225412429c1c50c122a1
        */
        private APIConnection(String APIKey, Pair<?, ?> Pair) {
            mAPIKey = APIKey;
            mCoordinatePair = Pair;
            /* Create connection string (URL) */
            mConnectionString = String.format(mBaseURL,
                    mCoordinatePair.getLeft(),
                    mCoordinatePair.getRight(),
                    mAPIKey);
        }

        /* Get URL for connection to weather API */
        public String getAPIContent() {
            return mConnectionString;
        }

        public String doInBackground(String... params) {

            URL url = null;
            try {
                url = new URL(getAPIContent());
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

        // When information has been fetched from weathermap, show data in dashboard
        protected void onPostExecute(String pageText) {
            try {
                json = new JSONObject(pageText);

                // Humidity, pressure, temperature etc.
                humidity = json.getJSONObject(TAG_MAIN).getInt(TAG_HUMIDITY);
                pressure = json.getJSONObject(TAG_MAIN).getInt(TAG_PRESSURE);
                temperature = convertKelvinToCelsius(json.getJSONObject(TAG_MAIN).getInt(TAG_TEMPERATURE));
                wind_speed = json.getJSONObject(TAG_WIND).getDouble(TAG_SPEED);
                cloudiness = json.getJSONObject(TAG_CLOUDS).getInt(TAG_ALL);
                city_name = json.getString(TAG_CITY);
                description = json.getJSONArray(TAG_WEATHER).getJSONObject(0).getString(TAG_DESCRIPTION);
                Log.v("HESTE", json.getJSONArray(TAG_WEATHER).getJSONObject(0).getString(TAG_DESCRIPTION));

                // Display data in UI
                tempTextView.setText(String.format("%s °C", temperature.toString()));
                humidityTextView.setText(String.format("%s %s", humidity, "%"));
                windSpeedTextView.setText(String.format("%s m/s", wind_speed));
                cloudinessTextView.setText(String.format("%s %s", cloudiness, "%"));
                cityTextView.setText(String.format("%s, %s", city_name, description));

                wbgt = calculateWBGT(wind_speed, humidity, pressure);
                wbgt_no_solar.setText(String.format("TWBG No solar: %s", wbgt.getTwbgWithoutSolar()));
                wbgt_solar.setText(String.format("TWBG Solar:       %s", wbgt.getTwbgWithSolar()));

                // Send notification if values are outside recommended range
                if(wbgt.getTwbgWithoutSolar() > 21.0 && !notificationSent) {
                    setNotificationChannel();
                    createNotification(getString(R.string.app_name), getString(R.string.notificationDescription), notificationID);
                    preferences.edit().putBoolean("notification_sent", true).apply();
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

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
    }

    private WBGT calculateWBGT(double wind_speed, double humidity, double pressure) {
        Calendar calendar = Calendar.getInstance();
        int utcOffset = (calendar.get(Calendar.ZONE_OFFSET) + calendar.get(Calendar.DST_OFFSET)) / (60 * 60000); // Total offset (geographical and daylight savings) from UTC in hours
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

        Solar s = new Solar(Double.parseDouble(longitude), Double.parseDouble(latitude), calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all wbgt calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg,
                Double.parseDouble(latitude),
                Double.parseDouble(longitude),
                sr.solarIrradiation(), pressure, Tair, humidity, wind_speed, zspeed, dT, urban);
        return wbgt;
    }

    public int convertKelvinToCelsius(int temperatureInKelvin) {
        return temperatureInKelvin - (int) 273.15;
    }
}