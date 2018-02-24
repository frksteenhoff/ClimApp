package com.example.android.climapp;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.Settings;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
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

/**
 * Created by frksteenhoff on 29-10-2017.
 */

public class DashboardActivity extends AppCompatActivity
        implements NavigationView.OnNavigationItemSelectedListener, LocationListener {

    TextView tempTextView, humidityTextView, pressureTextView, maleView;

    private final int REQUEST_RESOLVE_GOOGLE_CLIENT_ERROR = 1;
    boolean mResolvingError;
    private LocationManager locationManager;
    private Location location;
    private String provider;
    Button mButton;
    TextView tvother, tvother2;

    SharedPreferences preferences;
    SharedPreferences.Editor editor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        // Check whether onboarding has been completed
        if(!preferences.getBoolean("onboarding_complete", false)) {
            // Start onboarding activity
            Intent onBoarding = new Intent(this, OnBoardingActivity.class);
            startActivity(onBoarding);

            // Close main activity
            finish();
            return;
        }

        // Attach navigation drawer
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();

        /* Location coordinates */
        mButton = (Button) findViewById(R.id.locationButton);
        tvother = (TextView) findViewById(R.id.other);
        tvother2 = (TextView) findViewById(R.id.other2);

        /* TODO - change with phone's location */
        // Initialize locationManager
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Criteria criteria = new Criteria();
        criteria.setAccuracy(Criteria.ACCURACY_COARSE);

        /*// Check for permission to use location
        try {
            provider = locationManager.getBestProvider(criteria, true);
            location = locationManager.getLastKnownLocation(provider);
        } catch(SecurityException e) {
            e.printStackTrace();
        }

        // Initialize the location
        if (location != null) {
            tvother.setText("Source = " + provider);
            onLocationChanged(location);
        }*/

        Pair<Integer, Integer> Coordinates = new Pair<Integer, Integer>(35,139);

        /* Connect to weather API openweathermap.com */
        APIConnection APIConn = new APIConnection("b1b15e88fa797225412429c1c50c122a1", Coordinates);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
        APIConn.execute();

        // Reference to views that should be updated
        tempTextView     = (TextView) findViewById(R.id.temp_value);
        humidityTextView = (TextView) findViewById(R.id.humidity_value);
        pressureTextView = (TextView) findViewById(R.id.other_value);

        NavigationView navigationView = (NavigationView) findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
    }
    /*
    @Override
    protected void onResume() {
        super.onResume();
        try {
            locationManager.requestLocationUpdates(provider, 500, 1, this);
        }
        catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        locationManager.removeUpdates(this);
    }
    */
    @Override
    public void onBackPressed() {
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        if (drawer.isDrawerOpen(GravityCompat.START)) {
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.navigation, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            Intent settings = new Intent(DashboardActivity.this, SettingsActivity.class);
            startActivity(settings);
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onLocationChanged(Location location) {
        double lat = location.getLatitude();
        double lng = location.getLongitude();
        tvother.setText(String.valueOf(lat) + " " + String.valueOf(lng));
    }

    private boolean isLocationEnabled() {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }

    private void showAlert() {
        final AlertDialog.Builder dialog = new AlertDialog.Builder(this);
        dialog.setTitle("Enable Location")
                .setMessage("Your Locations Settings is set to 'Off'.\nPlease Enable Location to " +
                        "use this app")
                .setPositiveButton("Location Settings", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface paramDialogInterface, int paramInt) {
                        Intent myIntent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                        startActivity(myIntent);
                    }
                })
                .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface paramDialogInterface, int paramInt) {
                    }
                });
        dialog.show();
    }


    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        tvother2.setText("Source = " + provider);
    }
    @Override
    public void onProviderEnabled(String provider) {
        tvother2.setText("Source = " + provider);
    }
    @Override
    public void onProviderDisabled(String provider) {
        tvother2.setText("Source = " + provider);
    }

    @SuppressWarnings("StatementWithEmptyBody")
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();

        if (id == R.id.nav_account) {

        } else if (id == R.id.nav_manage) {
            Intent settings = new Intent(DashboardActivity.this, SettingsActivity.class);
            startActivity(settings);

        } else if (id == R.id.nav_share) {

        } else if (id == R.id.nav_send) {

        }
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

    // TODO: refactor such that APIConnection is in it's own class
    public class APIConnection extends AsyncTask<String, String, String> {

        /* Key authorizing connection to API */
        private String mAPIKey;

        /* Bas eurl to weather API */
        private String mBaseURL = "http://samples.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s";
        /* Longitude/latitude pair */
        private Pair<?,?> mPair;
        /* Calculated string based on input in constructor */
        private String mConnectionString;
        private String pageText;

        // JSON Node names
        private static final String TAG_MAIN        = "main";
        private static final String TAG_TEMPERATURE = "temp";
        private static final String TAG_HUMIDITY    = "humidity";
        private static final String TAG_PRESSURE    = "pressure";

        private Integer humidity, pressure, temperature, other;

        public JSONObject json;
        /* Only working for creating the needed connection string to
        *  openweathermap.org, others will be implemented later on.
        *  Example with input parameters:
        *  http://openweathermap.org/data/2.5/weather?lat=35&lon=139&appid=b1b15e88fa797225412429c1c50c122a1
        */
        public APIConnection(String APIKey, Pair<?,?> Pair) {
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
                humidity    = json.getJSONObject(TAG_MAIN).getInt(TAG_HUMIDITY);
                pressure    = json.getJSONObject(TAG_MAIN).getInt(TAG_PRESSURE);
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
