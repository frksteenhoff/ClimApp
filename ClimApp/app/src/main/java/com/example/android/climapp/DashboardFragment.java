package com.example.android.climapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationListener;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

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
import java.util.stream.Collectors;


/**
 * Created by frksteenhoff
 *
 * Some of the code snippets/methods related to fetching the device's location
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
        GoogleApiClient.OnConnectionFailedListener, LocationListener {

    public DashboardFragment() {
        // Required empty constructor
    }

    private static final int MY_PERMISSIONS_REQUEST_LOCATION = 0;
    private final static int PLAY_SERVICES_RESOLUTION_REQUEST = 1000;

    // Google client to interact with Google API
    private GoogleApiClient mGoogleApiClient;

    // Location API+
    private LocationRequest mLocationRequest;
    private FusedLocationProviderClient mFusedLocationClient;

    // Location updates intervals in sec
    private static int UPDATE_INTERVAL = 10000; // 10 sec
    private static int FATEST_INTERVAL = 5000; // 5 sec
    private static int DISPLACEMENT = 10; // 10 meters

    // Views and buttons
    private Button mLocationButton;
    private ToggleButton toggleVeryHigh, toggleHigh, toggleMedium, toggleLow, toggleVeryLow;
    private TextView txtLong, txtLat, errorText, toggleDescription;
    private TextView cityTextView, tempTextView, humidityTextView, windSpeedTextView;

    private SharedPreferences preferences;

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

        // Location view references, updated based on device's location
        mLocationButton = getActivity().findViewById(R.id.locationButton);
        toggleVeryLow = getActivity().findViewById(R.id.dash_toggle_very_low);
        toggleLow = getActivity().findViewById(R.id.dash_toggle_low);
        toggleMedium = getActivity().findViewById(R.id.dash_toggle_medium);
        toggleHigh = getActivity().findViewById(R.id.dash_toggle_high);
        toggleVeryHigh = getActivity().findViewById(R.id.dash_toggle_very_high);
        toggleDescription = getActivity().findViewById(R.id.activity_description_view);

        txtLong = getActivity().findViewById(R.id.long_coord);
        txtLat = getActivity().findViewById(R.id.lat_coord);
        errorText = getActivity().findViewById(R.id.error_txt);

        // Reference to views that should be updated based on open weather map data
        tempTextView = getActivity().findViewById(R.id.temp_value);
        humidityTextView = getActivity().findViewById(R.id.humidity_value);
        windSpeedTextView = getActivity().findViewById(R.id.wind_speed_value);
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
        toggleVeryLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(toggleVeryLow.isChecked()) {
                    updateActivityLevelView(toggleVeryLow, "very low", getString(R.string.activity_very_low_text));
                } else {
                    setUncheckedColors(toggleVeryLow);
                }
            }
        });

        toggleLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(toggleLow.isChecked()) {
                    updateActivityLevelView(toggleLow, "low", getString(R.string.activity_low_text));
                } else {
                    setUncheckedColors(toggleLow);
                }
            }
        });

        toggleMedium.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(toggleMedium.isChecked()) {
                    updateActivityLevelView(toggleMedium, "medium", getString(R.string.activity_medium_text));
                } else {
                    setUncheckedColors(toggleMedium);
                }
            }
        });

        toggleHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(toggleHigh.isChecked()) {
                    updateActivityLevelView(toggleHigh, "high", getString(R.string.activity_high_text));
                } else {
                    setUncheckedColors(toggleHigh);
                }
            }
        });

        toggleVeryHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(toggleVeryHigh.isChecked()) {
                    updateActivityLevelView(toggleVeryHigh, "very high", getString(R.string.activity_very_high_text));
                } else {
                    setUncheckedColors(toggleVeryHigh);
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
        Log.v("HESTE", "ACTIVITY LEVEL: " + activityLevel);
        switch (activityLevel) {
            case "very low":
                toggleVeryLow.setChecked(true);
                break;
            case "low":
                toggleLow.setChecked(true);
                break;
            case "high":
                toggleHigh.setChecked(true);
                break;
            case "very high":
                toggleVeryHigh.setChecked(true);
                break;
            default:
                toggleMedium.setChecked(true);
                break;
        }
    }

    /**
     * Update views and description of activity level when clicking on the different activity level toggle buttons
     * @param currentButton identifier of the button pressed
     * @param preferenceText the string value to save to shared preferences based on button pressed
     * @param activityDescription the description associated with the pressed button to be showed
     */
    private void updateActivityLevelView(ToggleButton currentButton, String preferenceText, String activityDescription) {
        // Set all views to false, afterwards: update only the one clicked to true
        toggleVeryLow.setChecked(false);
        toggleLow.setChecked(false);
        toggleMedium.setChecked(false);
        toggleHigh.setChecked(false);
        toggleVeryHigh.setChecked(false);
        currentButton.setChecked(true);

        // Set the rest of the parameters
        toggleDescription.setText(activityDescription);
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
                    errorText.setText(R.string.permission_denied);
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
                        if (location != null) {
                            setLocationViewVisibility(true);

                            // Make lat lon coordinates format, two decimal places
                            DecimalFormat df2 = new DecimalFormat(".##");

                            // Logic to get lat/lon from location object
                            String latitude = df2.format(location.getLatitude());
                            String longitude = df2.format(location.getLongitude());

                            // Update view components
                            txtLong.setText(latitude);
                            txtLat.setText(longitude);

                            // Put coordinate data into correct data structure for weather API
                            Pair<String, String> Coordinates = new Pair<String, String>(latitude, longitude);

                            // Connect to weather API openweathermap.com using location coordinates
                            getOpenWeatherMapData(Coordinates);

                        } else {
                            setLocationViewVisibility(false);

                            // Show error message
                            errorText.setText(R.string.location_error_text);
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
            errorText.setVisibility(View.GONE);
            txtLat.setVisibility(View.VISIBLE);
            txtLong.setVisibility(View.VISIBLE);
        } else {
            errorText.setVisibility(View.VISIBLE);
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
    @Override
    public void onLocationChanged(Location location) {
        double lat = location.getLatitude();
        double lng = location.getLongitude();
        txtLong.setText(String.valueOf(lng));
        txtLat.setText(String.valueOf(lat));
    }

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

    @Override
    public void onStatusChanged(String s, int i, Bundle bundle) {

    }

    @Override
    public void onProviderEnabled(String s) {

    }

    @Override
    public void onProviderDisabled(String s) {

    }

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
     * @param arg0
     */
    @Override
    public void onConnected(Bundle arg0) {
        // Once connected with google api, get the location
        displayLocation();
    }

    /**
     * Based on code made by androidHive
     */
    @Override
    public void onConnectionSuspended(int arg0) {
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
        private static final String TAG_TEMPERATURE = "temp";
        private static final String TAG_HUMIDITY = "humidity";
        private static final String TAG_PRESSURE = "pressure";
        private static final String TAG_SPEED = "speed";
        private static final String TAG_CITY = "name";

        private Integer humidity, pressure, temperature;
        private String city_name;
        private double wind_speed;

        private JSONObject json;

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

                // Saving information from JSONObject in user preferences
                // Humidity, pressure, temperature etc.
                humidity = json.getJSONObject(TAG_MAIN).getInt(TAG_HUMIDITY);
                pressure = json.getJSONObject(TAG_MAIN).getInt(TAG_PRESSURE);
                temperature = convertKelvinToCelsius(json.getJSONObject(TAG_MAIN).getInt(TAG_TEMPERATURE));
                wind_speed = json.getJSONObject(TAG_WIND).getDouble(TAG_SPEED);
                city_name = json.getString(TAG_CITY);

                // Display data in UI
                tempTextView.setText(String.format("%s °C", temperature.toString()));
                humidityTextView.setText(String.format("%s %s", humidity.toString(), "%"));
                windSpeedTextView.setText(String.format("%s m/s", wind_speed));
                cityTextView.setText(city_name);

                // Save all values to ser preferences
                preferences.edit().putInt("Humidity", humidity).apply();
                preferences.edit().putInt("Pressure", pressure).apply();
                preferences.edit().putString("Wind_speed", String.valueOf(wind_speed)).apply();
                preferences.edit().putInt("Temperature", temperature).apply();

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }
    public int convertKelvinToCelsius(int temperatureInKelvin) {
        return temperatureInKelvin - (int) 273.15;
    }
}