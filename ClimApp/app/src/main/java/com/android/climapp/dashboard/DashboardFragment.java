package com.android.climapp.dashboard;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.android.climapp.R;
import com.android.climapp.data.Api;
import com.android.climapp.data.RequestHandler;
import com.android.climapp.onboarding.OnBoardingActivity;
import com.android.climapp.utils.APIConnection;
import com.android.climapp.utils.Utils;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.UUID;

import static android.app.Activity.RESULT_OK;
import static android.content.Context.LOCATION_SERVICE;
import static com.android.climapp.utils.ApplicationConstants.ACTIVITY_LEVEL;
import static com.android.climapp.utils.ApplicationConstants.AGE;
import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.COLOR_DARKRED;
import static com.android.climapp.utils.ApplicationConstants.COLOR_GREEN;
import static com.android.climapp.utils.ApplicationConstants.COLOR_ORANGE;
import static com.android.climapp.utils.ApplicationConstants.COLOR_PLAIN;
import static com.android.climapp.utils.ApplicationConstants.COLOR_RED;
import static com.android.climapp.utils.ApplicationConstants.DEFAULT_HEIGHT;
import static com.android.climapp.utils.ApplicationConstants.DEFAULT_WEIGHT;
import static com.android.climapp.utils.ApplicationConstants.EXPLORE_MODE;
import static com.android.climapp.utils.ApplicationConstants.GENDER;
import static com.android.climapp.utils.ApplicationConstants.GUID;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT;
import static com.android.climapp.utils.ApplicationConstants.HEIGHT_VALUE;
import static com.android.climapp.utils.ApplicationConstants.ONBOARDING_COMPLETE;
import static com.android.climapp.utils.ApplicationConstants.TEMPERATURE_STR;
import static com.android.climapp.utils.ApplicationConstants.UNIT;
import static com.android.climapp.utils.ApplicationConstants.WBGT_VALUE;
import static com.android.climapp.utils.ApplicationConstants.WEIGHT;

/**
 * Created by frksteenhoff
 * - WBGT model calculations with weather input from combination of
 *   Open Weather Map and device's location. Implemented by JTOF, integrated in app by HESTE
 * - Some of the code snippets/methods related to getting the device's location
 *   is based on the tutorial and code made by AndroidHive:
 *   https://www.androidhive.info/2015/02/android-location-api-using-google-play-services/
 * - The Android Developer tutorial at has also been used as reference:
 *   https://developer.android.com/training/location/retrieve-current.html
 * - The methods/techniques used from these sources have been credited accordingly with a comment in
 *   the related documentation.
 */
public class DashboardFragment extends Fragment implements LocationListener, GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

    public DashboardFragment() {
        // Required empty constructor
    }

    private static final int CODE_GET_REQUEST = 1024;
    private static final int CODE_POST_REQUEST = 1025;

    private static final int ACCESS_COARSE_LOCATION_CODE = 3410;
    private static final int PLAY_SERVICES_RESOLUTION_REQUEST = 1000;
    private static final int GPS_ENABLE_REQUEST = 0x1001;
    private static final int WIFI_ENABLE_REQUEST = 0x1006;
    private static final String LONLAT_LINK = "http://www.latlong.net/"; // Used in explore mode, currently commented out

    // Google client to interact with Google API
    private GoogleApiClient mGoogleApiClient;
    private AlertDialog mInternetDialog;

    // Location API
    private LocationRequest mLocationRequest;
    private LocationManager mLocationManager;
    private FusedLocationProviderClient mFusedLocationClient;
    //private NotificationManager notificationManager;

    // Location updates intervals in sec
    private static int UPDATE_INTERVAL = 10000; // 10 sec
    private static int FATEST_INTERVAL = 5000; // 5 sec
    private static int DISPLACEMENT = 10; // 10 meters

    // Views and buttons
    private Button mLocationButton, exploreButton;
    private ImageView recommendationView, recommendationSmallView;
    private ToggleButton activityVeryHigh, activityHigh, activityMedium, activityLow, activityVeryLow;
    private TextView txtLong, txtLat, locationErrorTxt, activityLevelDescription,
            activityMoreTextView, heatStressTopView, heatStressTextView, lonlatView,
            temperatureValue, temperatureUnit, exploreLatitude, exploreLongitude;
    private RelativeLayout locationTopView, permissionErrorView;
    private LinearLayout updateLocationView, activityLevelView;
    private android.support.v7.widget.CardView exploreView, heatStressLevelView;
    private double latitude, longitude;
    private SharedPreferences.OnSharedPreferenceChangeListener sharedListener;
    private SharedPreferences preferences;
    private com.android.climapp.wbgt.RecommendedAlertLimitISO7243 ral;
    //private int notificationID = 1;
    //private boolean notificationSent;
    private APIConnection APIConn;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.dashboard_layout, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        mLocationManager = (LocationManager) getActivity().getSystemService(Context.LOCATION_SERVICE);

        preferences = this.getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);
        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(getActivity());

        // Store unique user ID once
        if(preferences.getString(GUID, null) == null) {
            String uniqueID = UUID.randomUUID().toString();
            preferences.edit().putString(GUID, uniqueID).apply();
            createUserInDatabase();
        }

        // Notification view and logic components
        //notificationManager = (NotificationManager) getActivity().getSystemService(NOTIFICATION_SERVICE);
        //notificationSent = preferences.getBoolean("notification_sent", false);

        // Cards
        locationTopView = getActivity().findViewById(R.id.location_top);
        heatStressLevelView = getActivity().findViewById(R.id.heat_stress_level);
        permissionErrorView = getActivity().findViewById(R.id.error_permission);
        updateLocationView = getActivity().findViewById(R.id.update_location);
        activityLevelView = getActivity().findViewById(R.id.activity_level);
        //exploreView = getActivity().findViewById(R.id.explore);

        // Activity level buttons
        activityVeryLow = getActivity().findViewById(R.id.dash_toggle_very_low);
        activityLow = getActivity().findViewById(R.id.dash_toggle_low);
        activityMedium = getActivity().findViewById(R.id.dash_toggle_medium);
        activityHigh = getActivity().findViewById(R.id.dash_toggle_high);
        activityVeryHigh = getActivity().findViewById(R.id.dash_toggle_very_high);
        activityLevelDescription = getActivity().findViewById(R.id.activity_description_view);
        activityMoreTextView = getActivity().findViewById(R.id.activity_more);

        // Explore TextView and Buttons
        //exploreButton = getActivity().findViewById(R.id.explore_button);
        //exploreLongitude = getActivity().findViewById(R.id.explore_longitude);
        //exploreLatitude = getActivity().findViewById(R.id.explore_latitude);
        lonlatView = getActivity().findViewById(R.id.latlon_link);

        // Location view references, updated based on device's location
        mLocationButton = getActivity().findViewById(R.id.locationButton);
        //txtLong = getActivity().findViewById(R.id.long_coord);
        //txtLat = getActivity().findViewById(R.id.lat_coord);

        // Temperature
        temperatureValue = getActivity().findViewById(R.id.temp_value);
        temperatureUnit = getActivity().findViewById(R.id.temperature_unit);

        // RAL
        recommendationView = getActivity().findViewById(R.id.ral);
        recommendationSmallView = getActivity().findViewById(R.id.ral_small);
        heatStressTopView = getActivity().findViewById(R.id.suggestion_top);
        heatStressTextView = getActivity().findViewById(R.id.suggestion_text);

        activityVeryLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityVeryLow.isChecked()) {
                    updateActivityLevelAndRecommendationView(activityVeryLow, "very low", getString(R.string.activity_very_low_text_short));
                } else {
                    setUncheckedColors(activityVeryLow);
                }
            }
        });

        activityLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityLow.isChecked()) {
                    updateActivityLevelAndRecommendationView(activityLow, "low", getString(R.string.activity_low_text_short));
                } else {
                    setUncheckedColors(activityLow);
                }
            }
        });

        activityMedium.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityMedium.isChecked()) {
                    updateActivityLevelAndRecommendationView(activityMedium, "medium", getString(R.string.activity_medium_text_short));
                } else {
                    setUncheckedColors(activityMedium);
                }
            }
        });

        activityHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityHigh.isChecked()) {
                    updateActivityLevelAndRecommendationView(activityHigh, "high", getString(R.string.activity_high_text_short));
                } else {
                    setUncheckedColors(activityHigh);
                }
            }
        });

        activityVeryHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityVeryHigh.isChecked()) {
                    updateActivityLevelAndRecommendationView(activityVeryHigh, "very high", getString(R.string.activity_very_high_text_short));
                } else {
                    setUncheckedColors(activityVeryHigh);
                }
            }
        });
        // Activity level "more" click listener
        // Based on classification of metabolic rate froom ISO 8996.
        activityMoreTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Start activity to provide full description of activity level
                Intent activityMore = new Intent(getActivity(), ActivityLevelListActivity.class);
                startActivity(activityMore);
            }
        });
        // Location button click listener
        mLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                displayLocation();
            }
        });

        /*exploreButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (twoValuesAreGiven() && isWithinCoordinateRange()) {
                    double lat = Double.parseDouble(exploreLatitude.getText().toString());
                    double lon = Double.parseDouble(exploreLongitude.getText().toString());
                    getOpenWeatherMapData(lat, lon);
                    heatStressLevelView.setVisibility(View.VISIBLE);
                } else {
                    Toast.makeText(getActivity().getApplicationContext(),
                            "Both coordinates need to be input and the longitude and latitude should be within proper ranges.", Toast.LENGTH_LONG)
                            .show();
                }
            }
        });*/

        lonlatView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(LONLAT_LINK));
                startActivity(browserIntent);
            }
        });

        /*
         * Used preferences changed listener to update view when preferred unit changes
         */
        sharedListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
            public void onSharedPreferenceChanged(SharedPreferences prefs, String key) {
                // Update dashboard view when units are changed.
                if(key.equals(UNIT)){
                    Activity act  = getActivity();
                    if (act != null){
                        Utils utils = new Utils(preferences);

                        if(prefs.getInt(UNIT, 0) == 1) {
                            temperatureUnit.setText(getString(R.string.temperature_unit_f));
                            temperatureValue.setText(String.format("%s°",
                                    utils.setCorrectTemperatureUnit(prefs.getInt(TEMPERATURE_STR, 0),1)+""));
                        } else {
                            temperatureUnit.setText(getString(R.string.temperature_unit_c));
                            temperatureValue.setText(String.format("%s°",
                                    utils.setCorrectTemperatureUnit(prefs.getInt(TEMPERATURE_STR, 0),0)+""));
                        }
                    }
                } else if (key.equals(EXPLORE_MODE)) {
                    if(prefs.getBoolean(EXPLORE_MODE, false)) {
                        exploreView.setVisibility(View.VISIBLE);
                        heatStressLevelView.setVisibility(View.GONE);
                    } else {
                        displayLocation();
                        exploreView.setVisibility(View.GONE);
                    }
                }
            }
        };

        preferences.registerOnSharedPreferenceChangeListener(sharedListener);

        // Set activity level on start if checked
        setCheckedActivityLevel();

        // Check whether user has skipped onboarding steps
        if(!onBoardingCompleted()) {
            startOnBoarding();
        }
    }

    private void createUserInDatabase() {
        String age = Integer.toString(preferences.getInt(AGE, 0));
        String gender = Integer.toString(preferences.getInt(GENDER, 0));
        String height = Float.toString(preferences.getFloat(HEIGHT, 0));
        String weight = Float.toString(preferences.getFloat(WEIGHT, 0));
        String unit = Integer.toString(preferences.getInt(UNIT, 0));



        HashMap<String, String> params = new HashMap<>();
        params.put("_id", preferences.getString(GUID, null));
        params.put("age", age);
        params.put("gender", gender);
        params.put("height", height);
        params.put("weight", weight);
        params.put("unit", unit);

        // Calling API to create user
        PerformNetworkRequest request = new PerformNetworkRequest(Api.URL_CREATE_USER, params, CODE_POST_REQUEST);
        request.execute();
    }

    /**
     * Latitude lines run east-west and are parallel to each other. If you go further north north, latitude values increase.
     * Latitude values (Y-values) range between -90 and +90 degrees
     *
     * Longitude lines run north-south. They converge at the poles.
     * Longitude values (X-values) are between -180 and +180 degrees.
     * @return true if both values are within range, false otherwise
     */
    private boolean isWithinCoordinateRange() {
        double lat = Double.parseDouble(exploreLatitude.getText().toString());
        double lon = Double.parseDouble(exploreLongitude.getText().toString());
        return (lat >= -90.0 && lat <= 90.0) && (lon >= -180.0 && lon <= 180.0);
    }

    public boolean twoValuesAreGiven() {
        return !exploreLatitude.getText().toString().equals("")
                && !exploreLongitude.getText().toString().equals("");
    }

    @Override
    public void onLocationChanged(Location location) {
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onProviderDisabled(String provider) {
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
        if (deviceHasInternetConnection()) {
            if(deviceHasLocationPermission()) {
                displayLocation();
            } else {
                requestPermission(Manifest.permission.ACCESS_COARSE_LOCATION, ACCESS_COARSE_LOCATION_CODE);
            }
        } else {
            showDashboardViews(false);
            showNoInternetDialog();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        preferences.registerOnSharedPreferenceChangeListener(sharedListener);
    }

    @Override
    public void onStop() {
        super.onStop();
       /* if (mGoogleApiClient.isConnected()) {
            mGoogleApiClient.disconnect();
        }*/
    }

    /**
     * On app start, set activity level to last value or medium if none.
     */
    private void setCheckedActivityLevel() {
        String activityLevel = preferences.getString(ACTIVITY_LEVEL, null);
        if (activityLevel != null) {
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
            preferences.edit().putString(ACTIVITY_LEVEL, "medium").apply();
            activityMedium.setChecked(true);
        }
    }

    /**
     * Update views and description of activity level when clicking on any of the activity level toggle buttons
     *
     * @param currentButton       identifier of the pressed button
     * @param preferenceText      the string value identifying the activity level of the pressed button
     *                            to save in shared preferences
     * @param activityDescription the activity level description for the pressed button
     */
    private void updateActivityLevelAndRecommendationView(ToggleButton currentButton,
                                                          String preferenceText,
                                                          String activityDescription) {
        // Set all views to false, afterwards: update only the one clicked to true
        activityVeryLow.setChecked(false);
        activityLow.setChecked(false);
        activityMedium.setChecked(false);
        activityHigh.setChecked(false);
        activityVeryHigh.setChecked(false);
        currentButton.setChecked(true);

        // Set colors correctly
        setUncheckedColors(activityVeryLow);
        setUncheckedColors(activityLow);
        setUncheckedColors(activityMedium);
        setUncheckedColors(activityHigh);
        setUncheckedColors(activityVeryHigh);

        // Mark new correct button
        setOnCheckedColors(currentButton);

        // Set corresponding description
        activityLevelDescription.setText(activityDescription);

        preferences.edit().putString(ACTIVITY_LEVEL, preferenceText).apply();

        if(preferences.getFloat(WBGT_VALUE, 0) != 0.0) {
            // Update color indicator after activity level change
            ral = new com.android.climapp.wbgt.RecommendedAlertLimitISO7243(
                    preferences.getString(ACTIVITY_LEVEL, "medium"),
                    preferences.getString(HEIGHT_VALUE, DEFAULT_HEIGHT),
                    preferences.getInt(WEIGHT, DEFAULT_WEIGHT));
            String color = ral.getRecommendationColor(preferences.getFloat(WBGT_VALUE, 0), ral.calculateRALValue());
            Log.v("HESTE", "UID: " + preferences.getString(GUID, null) +
                    " RAL: " + ral.calculateRALValue() +
                    " WBGT: "+ preferences.getFloat(WBGT_VALUE, 0) + " col:" + color);

            setRecommendationColorAndText(color);
        } else {
            setRecommendationColorAndText(COLOR_PLAIN);
        }
    }

    /**
     * Set color indicating heat-stress level
     * Set description for coping strategy based on heat-stress level
     * @param color the hex value for the color code
     */
    public void setRecommendationColorAndText(String color) {
        // Set color in view based on RAL interval
        recommendationView.setColorFilter(Color.parseColor(color));
        recommendationSmallView.setColorFilter(Color.parseColor(color));

        // Update text view with correction comping strategies
        switch (color) {
            case COLOR_GREEN:
                heatStressTopView.setText(R.string.suggestion_green_top);
                heatStressTextView.setText(R.string.suggestion_green);
                break;
            case COLOR_ORANGE:
                heatStressTopView.setText(R.string.suggestion_yellow_top);
                heatStressTextView.setText(R.string.suggestion_yellow);
                break;
            case COLOR_RED:
                heatStressTopView.setText(R.string.suggestion_red_top);
                heatStressTextView.setText(R.string.suggestion_red);
                break;
            case COLOR_DARKRED:
                heatStressTopView.setText(R.string.suggestion_dark_red_top);
                heatStressTextView.setText(R.string.suggestion_dark_red);
                break;
            default:
                heatStressTopView.setText(R.string.suggestion_default_top);
                heatStressTextView.setText(R.string.suggestion_default);
        }
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

    public int getTemperatureUnit() {
        int unit = preferences.getInt(UNIT, 0);
        if(unit == 1){
            return R.string.temperature_unit_f;
        } else {
            return R.string.temperature_unit_c;
        }
    }

    /**
     * If user have not setup permission for app
     * prompt user for update -- result in callback method onRequestPermissionResult.
     */
    private void requestPermission(String permissionName, int permissionCode) {
        // Request the needed permission
        ActivityCompat.requestPermissions(getActivity(),
                new String[]{permissionName},
                permissionCode);
    }


    /**
     * The callback when user is prompted to grant permission to access
     * device's location.
     *
     * @param requestCode code matching the permission the callback is from
     * @param permissions  array of permissions
     * @param grantResults result, whether permission is granted or not
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case ACCESS_COARSE_LOCATION_CODE: {
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
                }
                return;
            }
            // 'case' lines to check for other permissions.
        }
    }

    private boolean deviceHasInternetConnection() {
        ConnectivityManager manager = (ConnectivityManager) getActivity().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo ni = manager.getActiveNetworkInfo();

        return (ni != null && ni.getState() == NetworkInfo.State.CONNECTED);
    }

    /**
     * Checks whether user has allowed the application to get device's location.
     *
     * @return true if access to device location is granted, false otherwise.
     */
    private boolean deviceHasLocationPermission() {
        return !(ContextCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(getActivity(),
                        android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED);
    }

    private boolean onBoardingCompleted() {
        return preferences.getBoolean(ONBOARDING_COMPLETE, false);
    }

    /**
     * Method to display the location in UI
     * Based on code from AndroidHive and Android Developer, heavily edited.
     * Checking whether location permission is given, provides option to grant permission if
     * not already granted.
     */
    private void displayLocation() {
        if (ContextCompat.checkSelfPermission(getActivity(),
                android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

        }
        if(deviceHasInternetConnection()) {
            if (deviceHasLocationPermission()) {
                mFusedLocationClient.getLastLocation()
                        .addOnSuccessListener(getActivity(), new OnSuccessListener<Location>() {
                            @Override
                            public void onSuccess(Location location) {
                                if (location != null) {
                                    //setLocationViewVisibility(true);
                                    showDashboardViews(true);

                                    // Logic to get lat/lon from location object
                                    latitude = location.getLatitude();
                                    longitude = location.getLongitude();
                                    //double altitude = location.getAltitude();
                                    // Connect to weather API openweathermap.com using location coordinates
                                    getOpenWeatherMapData(latitude, longitude);
                                } else {
                                    Toast.makeText(getActivity().getApplicationContext(),
                                            R.string.missing_location_data, Toast.LENGTH_LONG)
                                            .show();
                                    showDashboardViews(false);
                                }
                            }
                        });
            } else {
                showDashboardViews(false);
                showGPSDisabledDialog();
            }
        } else {
            showDashboardViews(false);
            showNoInternetDialog();
        }
    }

    private void showDashboardViews(boolean showWeatherData) {
        if(showWeatherData) {
            locationTopView.setVisibility(View.VISIBLE);
            heatStressLevelView.setVisibility(View.VISIBLE);
            updateLocationView.setVisibility(View.GONE);
            activityLevelView.setVisibility(View.VISIBLE);
            permissionErrorView.setVisibility(View.GONE);

            // Only show the explorer view if enabled by the user
            /*if(preferences.getBoolean("Explore", false)) {
                exploreView.setVisibility(View.VISIBLE);
            } else {
                exploreView.setVisibility(View.GONE);
            }*/
        } else {
            locationTopView.setVisibility(View.GONE);
            heatStressLevelView.setVisibility(View.GONE);
            updateLocationView.setVisibility(View.GONE);
            activityLevelView.setVisibility(View.GONE);
            permissionErrorView.setVisibility(View.VISIBLE);
            //exploreView.setVisibility(View.GONE);
        }
    }

    private void showNoInternetDialog() {
        if (mInternetDialog != null && mInternetDialog.isShowing()) {
            return;
        }
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle(R.string.internet_disabled);
        builder.setMessage(R.string.internet_disabled_message);
        builder.setPositiveButton(R.string.turn_on_wifi, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent wifiOptionsIntent = new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS);
                startActivityForResult(wifiOptionsIntent, WIFI_ENABLE_REQUEST);
            }
        }).setNegativeButton(R.string.choice_return_button, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });
        mInternetDialog = builder.create();
        mInternetDialog.show();
    }

    private void showGPSDisabledDialog() {
        AlertDialog.Builder alertDialog = new AlertDialog.Builder(getContext());

        // Setting Dialog Title
        alertDialog.setTitle(R.string.gps_turned_off);
        // Setting Dialog Message
        alertDialog.setMessage(R.string.gps_turned_off_message);

        // On pressing Settings button
        alertDialog.setPositiveButton( R.string.enable_gps, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent gpsOptionsIntent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                startActivityForResult(gpsOptionsIntent, ACCESS_COARSE_LOCATION_CODE);
            }
        });

        // on pressing cancel button
        alertDialog.setNegativeButton(R.string.choice_return_button, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        alertDialog.create();
        // Showing Alert Message
        alertDialog.show();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == GPS_ENABLE_REQUEST) {
            if (mLocationManager == null) {
                mLocationManager = (LocationManager) getActivity().getSystemService(LOCATION_SERVICE);
            }
            /*
            if (!mLocationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                showDashboardViews(false);
                showGPSDisabledDialog();
            }*/
            if(resultCode == RESULT_OK) {
                displayLocation();
            } else {
                showDashboardViews(false);
                showGPSDisabledDialog();
            }

        } else if (requestCode == WIFI_ENABLE_REQUEST) {
            if(resultCode == RESULT_OK) {
                displayLocation();
            } else {
                showDashboardViews(false);
                showNoInternetDialog();
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * With device's location, fetch weather data from OpeanWeatherMap.com
     *
     * @param latitude lat part of location coordinates fetched from device
     * @param longitude lon part of location coordinates fetched from device
     */
    private void getOpenWeatherMapData(double latitude, double longitude) {
        if(exploreMode()) {
            if (twoValuesAreGiven() && isWithinCoordinateRange()) {
                double lat = Double.parseDouble(exploreLatitude.getText().toString());
                double lon = Double.parseDouble(exploreLongitude.getText().toString());
                // TODO: Written in clear text should be hidden somehow
                APIConn = new APIConnection("f22065144b2119439a589cbfb9d851d3", lat, lon, preferences, this);
                APIConn.execute();
            }
        } else {
            APIConn = new APIConnection("f22065144b2119439a589cbfb9d851d3", latitude, longitude, preferences, this);
            APIConn.execute();
        }
    }

    private boolean exploreMode() {
        return preferences.getBoolean(EXPLORE_MODE, false);
    }

    public void saveFloatToPreferences(String preference, float value){
        preferences.edit().putFloat(preference, value).apply();
    }

    public void saveIntToPreferences(String preference, int value){
        preferences.edit().putInt(preference, value).apply();
    }

    public void saveStringToPreferences(String preference, String value){
        preferences.edit().putString(preference, value).apply();
    }

    /**
     * Creating location request object
     * Code added as originally made by AndroidHive
     */
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
     */
    protected synchronized void buildGoogleApiClient() {
        mGoogleApiClient = new GoogleApiClient.Builder(getActivity())
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API).build();
    }

    /**
     * Method to verify google play services on the device
     * Code added as originally made by AndroidHive
     */
    private boolean checkPlayServices() {
        int resultCode = GooglePlayServicesUtil
                .isGooglePlayServicesAvailable(getActivity());
        if (resultCode != ConnectionResult.SUCCESS) {
            if (GooglePlayServicesUtil.isUserRecoverableError(resultCode)) {
                GooglePlayServicesUtil.getErrorDialog(resultCode, getActivity(),
                        PLAY_SERVICES_RESOLUTION_REQUEST).show();
            } else {
                Toast.makeText(getActivity().getApplicationContext(),
                        R.string.device_not_supported, Toast.LENGTH_LONG)
                        .show();
            }
            return false;
        }
        return true;
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
     *
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


    /*
     * Network request to connect API with database
     * NOT YET INTEGRATED WITH REMAINING CODE BASE
     * */
    private class PerformNetworkRequest extends AsyncTask<Void, Void, String> {
        String url;
        HashMap<String, String> params;
        int requestCode;

        PerformNetworkRequest(String url, HashMap<String, String> params, int requestCode) {
            this.url = url;
            this.params = params;
            this.requestCode = requestCode;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            try {
                JSONObject object = new JSONObject(s);
                if (!object.getBoolean("error")) {
                    Toast.makeText(getActivity().getApplicationContext(), object.getString("message"), Toast.LENGTH_SHORT).show();
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        @Override
        protected String doInBackground(Void... voids) {
            RequestHandler requestHandler = new RequestHandler();

            if (requestCode == CODE_POST_REQUEST)
                return requestHandler.sendPostRequest(url, params);

            if (requestCode == CODE_GET_REQUEST)
                return requestHandler.sendGetRequest(url);

            return null;
        }
    }
}