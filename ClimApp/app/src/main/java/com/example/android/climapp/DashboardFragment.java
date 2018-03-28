package com.example.android.climapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
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
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;


public class DashboardFragment extends Fragment implements LocationListener {

    public DashboardFragment() {
        // Required empty constructor
    }

    TextView tempTextView, humidityTextView, pressureTextView, maleView;

    private LocationManager locationManager;
    private String provider;
    Button mButton;
    TextView txtLong, txtLat, txtSource;

    SharedPreferences preferences;
    SharedPreferences.Editor editor;

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

        // Check whether onboarding has been completed
        if (!preferences.getBoolean("onboarding_complete", false)) {
            // Start onboarding activity
            Intent onBoarding = new Intent(getActivity(), OnBoardingActivity.class);
            startActivity(onBoarding);

            // Close main activity
            getActivity().finish();
        }
/*
        // Attach navigation drawer
        DrawerLayout drawer = (DrawerLayout) v.findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                getActivity(), drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();*/

        /* Location coordinates */
        mButton = (Button) getActivity().findViewById(R.id.locationButton);
        txtLong = (TextView) getActivity().findViewById(R.id.long_coord);
        txtLat = (TextView) getActivity().findViewById(R.id.lat_coord);
        txtSource = (TextView) getActivity().findViewById(R.id.source_);

        Pair<Integer, Integer> Coordinates = new Pair<Integer, Integer>(35, 139);

        /* Connect to weather API openweathermap.com */
        APIConnection APIConn = new APIConnection("b1b15e88fa797225412429c1c50c122a1", Coordinates);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
        APIConn.execute();

        // Reference to views that should be updated
        tempTextView = (TextView) getActivity().findViewById(R.id.temp_value);
        humidityTextView = (TextView) getActivity().findViewById(R.id.humidity_value);
        pressureTextView = (TextView) getActivity().findViewById(R.id.other_value);
/*
        NavigationView navigationView = (NavigationView) v.findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
*/
        // Initialize locationManager
        locationManager = (LocationManager) getActivity().getSystemService(Context.LOCATION_SERVICE);

        Criteria criteria = new Criteria();
        provider = locationManager.getBestProvider(criteria, false);

        // Check for permission
        if (ActivityCompat.checkSelfPermission(getActivity(), android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Location location = locationManager.getLastKnownLocation(provider);

        // Initialize the location
        if (location != null) {
            txtSource.setText("Source = " + provider);
            onLocationChanged(location);
        }

    }

    // Start updates when app starts/resumes
    @Override
    public void onResume() {
        super.onResume();
        if (ActivityCompat.checkSelfPermission(getActivity(), android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        locationManager.requestLocationUpdates(provider, 500, 1, this);
    }

    @Override
    public void onPause() {
        super.onPause();
        locationManager.removeUpdates(this);
    }

    @Override
    public void onLocationChanged(Location location) {
        double lat = location.getLatitude();
        double lng = location.getLongitude();
        txtLat.setText(String.valueOf(lat));
        txtLong.setText(String.valueOf(lng));
        txtSource.setText("Source = " + provider);
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        txtSource.setText("Source = " + provider);
    }

    @Override
    public void onProviderEnabled(String provider) {
        txtSource.setText("Source = " + provider);
    }

    @Override
    public void onProviderDisabled(String provider) {
        txtSource.setText("Source = " + provider);
    }

    // TODO: refactor such that APIConnection is in it's own class
    public class APIConnection extends AsyncTask<String, String, String> {

        /* Key authorizing connection to API */
        private String mAPIKey;

        /* Bas eurl to weather API */
        private String mBaseURL = "http://samples.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s";
        /* Longitude/latitude pair */
        private Pair<?, ?> mPair;
        /* Calculated string based on input in constructor */
        private String mConnectionString;
        private String pageText;

        // JSON Node names
        private static final String TAG_MAIN = "main";
        private static final String TAG_TEMPERATURE = "temp";
        private static final String TAG_HUMIDITY = "humidity";
        private static final String TAG_PRESSURE = "pressure";

        private Integer humidity, pressure, temperature, other;

        public JSONObject json;

        /* Only working for creating the needed connection string to
        *  openweathermap.org, others will be implemented later on.
        *  Example with input parameters:
        *  http://openweathermap.org/data/2.5/weather?lat=35&lon=139&appid=b1b15e88fa797225412429c1c50c122a1
        */
        public APIConnection(String APIKey, Pair<?, ?> Pair) {
            mAPIKey = APIKey;
            mPair = Pair;
            /* Create connection string (URL) from where to fetch content */
            mConnectionString = String.format(mBaseURL, mPair.getLeft().toString(), mPair.getRight().toString(), mAPIKey);
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
                temperature = json.getJSONObject(TAG_MAIN).getInt(TAG_TEMPERATURE);

                // Display data in UI
                // Setting minimum length of string to be 15
                tempTextView.setText(temperature.toString() + " K");
                humidityTextView.setText(humidity.toString() + "%");
                pressureTextView.setText(pressure.toString() + " atm");

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
}
