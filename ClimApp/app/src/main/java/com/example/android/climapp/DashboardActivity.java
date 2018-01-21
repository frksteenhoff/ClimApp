package com.example.android.climapp;

import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
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
        implements NavigationView.OnNavigationItemSelectedListener {

    TextView tempTextView, humidityTextView, pressureTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();

        /* Get current weather information */
        /* Location coordinates*/
        /* TODO - change with phone's location */
        Pair<Integer, Integer> Coordinates = new Pair<Integer, Integer>(35,139);

        /* Connect to weather API openweathermap.com */
        APIConnection APIConn = new APIConnection("b1b15e88fa797225412429c1c50c122a1", Coordinates);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
        APIConn.execute();

        // Reference to views that should be updated
        tempTextView     = (TextView) findViewById(R.id.temp_info);
        humidityTextView = (TextView) findViewById(R.id.humidity_info);
        pressureTextView = (TextView) findViewById(R.id.other_info);

        NavigationView navigationView = (NavigationView) findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
    }

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
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @SuppressWarnings("StatementWithEmptyBody")
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();

        if (id == R.id.nav_account) {

        } else if (id == R.id.nav_manage) {

        } else if (id == R.id.nav_share) {

        } else if (id == R.id.nav_send) {

        }
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

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

        protected void onPostExecute(String pageText) {
            try {
                json = new JSONObject(pageText);

                // Getting needed information from JSONObject
                // Humidity, pressure, temperature etc.
                System.out.println(json.getJSONObject(TAG_MAIN));
                humidity    = json.getJSONObject(TAG_MAIN).getInt(TAG_HUMIDITY);
                pressure    = json.getJSONObject(TAG_MAIN).getInt(TAG_PRESSURE);
                temperature = json.getJSONObject(TAG_MAIN).getInt(TAG_TEMPERATURE);

                // Display data in UI
                tempTextView.setText(String.format("%15s","Temperature: ") + temperature.toString() + " K");
                humidityTextView.setText(String.format("%15s","Humidity:    ") + humidity.toString() + "%");
                pressureTextView.setText(String.format("%15s","Pressure:    ") + pressure.toString() + " atm");

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }
}
