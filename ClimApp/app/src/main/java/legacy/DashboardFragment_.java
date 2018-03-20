package legacy;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.NavigationView;
import android.support.v4.app.Fragment;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.example.android.climapp.OnBoardingActivity;
import com.example.android.climapp.Pair;
import com.example.android.climapp.R;
import com.example.android.climapp.SettingsActivity;

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


public class DashboardFragment_ extends Fragment
        implements NavigationView.OnNavigationItemSelectedListener {

    public DashboardFragment_() {
        // Required empty constructor
    }

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
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View v = inflater.inflate(R.layout.fragment_dashboard, container, false);

        Toolbar toolbar = (Toolbar) v.findViewById(R.id.toolbar);
        ((AppCompatActivity)getActivity()).setSupportActionBar(toolbar);

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
        mButton = (Button) v.findViewById(R.id.locationButton);
        tvother = (TextView) v.findViewById(R.id.other);
        tvother2 = (TextView) v.findViewById(R.id.other2);

        /* TODO - change with phone's location */
        // Initialize locationManager
        locationManager = (LocationManager) getActivity().getSystemService(Context.LOCATION_SERVICE);
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

        Pair<Integer, Integer> Coordinates = new Pair<Integer, Integer>(35, 139);

        /* Connect to weather API openweathermap.com */
        APIConnection APIConn = new APIConnection("b1b15e88fa797225412429c1c50c122a1", Coordinates);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIContent());
        APIConn.execute();

        // Reference to views that should be updated
        tempTextView = (TextView) v.findViewById(R.id.temp_value);
        humidityTextView = (TextView) v.findViewById(R.id.humidity_value);
        pressureTextView = (TextView) v.findViewById(R.id.other_value);
/*
        NavigationView navigationView = (NavigationView) v.findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
*/
        return v;
    }

    @SuppressWarnings("StatementWithEmptyBody")
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();

        if (id == R.id.nav_account) {

        } else if (id == R.id.nav_manage) {
            Intent settings = new Intent(getActivity(), SettingsActivity.class);
            startActivity(settings);

        } else if (id == R.id.nav_share) {

        } else if (id == R.id.nav_send) {

        }
        DrawerLayout drawer = (DrawerLayout) getActivity().findViewById(R.id.drawer_layout);
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
