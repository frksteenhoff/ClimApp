package com.example.android.climapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

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

    // Location API
    private LocationRequest mLocationRequest;
    private FusedLocationProviderClient mFusedLocationClient;

    // Location updates intervals in sec
    private static int UPDATE_INTERVAL = 10000; // 10 sec
    private static int FATEST_INTERVAL = 5000; // 5 sec
    private static int DISPLACEMENT = 10; // 10 meters

    // Views and buttons
    private Button mLocationButton;
    private TextView txtLong, txtLat, errorText;
    private TextView cityTextView, tempTextView, humidityTextView, pressureTextView;

    private SharedPreferences preferences;
    private SharedPreferences.Editor editor;

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
        editor = preferences.edit();
        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(getActivity());

        // Location view references, updated based on device's location
        mLocationButton = (Button) getActivity().findViewById(R.id.locationButton);
        txtLong = (TextView) getActivity().findViewById(R.id.long_coord);
        txtLat = (TextView) getActivity().findViewById(R.id.lat_coord);
        errorText = (TextView) getActivity().findViewById(R.id.error_txt);

        // Reference to views that should be updated based on open weather map data
        tempTextView = (TextView) getActivity().findViewById(R.id.temp_value);
        humidityTextView = (TextView) getActivity().findViewById(R.id.humidity_value);
        pressureTextView = (TextView) getActivity().findViewById(R.id.other_value);
        cityTextView = (TextView) getActivity().findViewById(R.id.current_city);

        // Check whether onboarding has been completed
        // if onboarding steps still missing, start onboarding
        // Otherwise, check location permission and connect to openweathermap
        if(!onBoardingCompleted()) {

            startOnBoarding();

        } else {
            // Check whether app har permission to access location
            // If access granted, display location.
            // Otherwise prompt user for location settings change
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

        // Show location button click listener
        mLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                displayLocation();
            }
        });
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
     * @param permissions
     * @param grantResults
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
        if (ContextCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        } else {
            // Permission is granted
            return true;
        }
    }

    /**
     * Check whether onboarding has been completed
     * @return true if onboarding completed, false otherwise
     */
    private boolean onBoardingCompleted() {
        if (!preferences.getBoolean("onboarding_complete", false)) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Method to display the location in UI
     * Based on code from AndroidHive and Android Developer, heavily edited.
     * */
    private void displayLocation() {

        if (ActivityCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
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

                            Pair<String, String> Coordinates = new Pair<String, String>(latitude, longitude);

                            // Connect to weather API openweathermap.com using location coordinates
                            APIConnection APIConn = new APIConnection("f22065144b2119439a589cbfb9d851d3", Coordinates);
                            Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
                            APIConn.execute();

                        } else {
                            setLocationViewVisibility(false);

                            // Show error message
                            errorText.setText(R.string.location_error_text);
                        }
                    }
                });
    }

    /**
     * Set correct UI components according to whether location
     * permission has been granted by user or not.
     * If permission, show coordinates, no error message
     * If not permission, show error message, no coordinates.
     * @param locationFound
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
            return;
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
     * @param location
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
        private static final String TAG_TEMPERATURE = "temp";
        private static final String TAG_HUMIDITY = "humidity";
        private static final String TAG_PRESSURE = "pressure";
        private static final String TAG_CITY = "name";

        private Integer humidity, pressure, temperature;
        private String city_name;

        public JSONObject json;

        /* Only working for creating the needed connection string to
        *  openweathermap.org, others will be implemented later on.
        *  Example with input parameters:
        *  http://openweathermap.org/data/2.5/weather?lat=35&lon=139&appid=b1b15e88fa797225412429c1c50c122a1
        */
        public APIConnection(String APIKey, Pair<?, ?> Pair) {
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
                city_name = json.getString(TAG_CITY);

                // Display data in UI
                // Setting minimum length of string to be 15
                tempTextView.setText(temperature.toString() + " °C");
                humidityTextView.setText(humidity.toString() + "%");
                pressureTextView.setText(pressure.toString() + " atm");
                cityTextView.setText(city_name);

                // Save all values to ser preferences
                editor.putInt("Humidity", humidity);
                editor.putInt("Pressure", pressure);
                editor.putInt("Temperature", temperature);
                editor.commit();

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }
    public int convertKelvinToCelsius(int temperatureInKelvin) {
        return temperatureInKelvin - (int) 273.15;
    }
}
