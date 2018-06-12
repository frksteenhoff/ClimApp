package com.example.android.climapp.dashboard;

import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v7.app.AlertDialog;
import android.support.v7.widget.CardView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.example.android.climapp.R;
import com.example.android.climapp.onboarding.OnBoardingActivity;
import com.example.android.climapp.utils.APIConnection;
import com.example.android.climapp.utils.Pair;
import com.example.android.climapp.wbgt.RecommendedAlertLimit;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

import java.text.DecimalFormat;

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
public class DashboardFragment extends Fragment implements GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

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
    //private NotificationManager notificationManager;

    // Location updates intervals in sec
    private static int UPDATE_INTERVAL = 10000; // 10 sec
    private static int FATEST_INTERVAL = 5000; // 5 sec
    private static int DISPLACEMENT = 10; // 10 meters

    // Views and buttons
    private Button mLocationButton;
    private ImageView recommendationView, recommendationSmallView;
    private ToggleButton activityVeryHigh, activityHigh, activityMedium, activityLow, activityVeryLow;
    private TextView txtLong, txtLat, locationErrorTxt, activityLevelDescription,
            dismissWarningtextView, activityMoreTextView;
    private CardView warningCardView;

    private String latitude, longitude;
    private SharedPreferences preferences;
    private RecommendedAlertLimit ral;
    //private int notificationID = 1;
    //private boolean notificationSent;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.dashboard_layout, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {

        preferences = this.getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(getActivity());

        // Notification view and logic components
        //notificationManager = (NotificationManager) getActivity().getSystemService(NOTIFICATION_SERVICE);
        //notificationSent = preferences.getBoolean("notification_sent", false);
        warningCardView = getActivity().findViewById(R.id.warning_view);
        dismissWarningtextView = getActivity().findViewById(R.id.dismiss_warning);

        // Activity level buttons
        activityVeryLow = getActivity().findViewById(R.id.dash_toggle_very_low);
        activityLow = getActivity().findViewById(R.id.dash_toggle_low);
        activityMedium = getActivity().findViewById(R.id.dash_toggle_medium);
        activityHigh = getActivity().findViewById(R.id.dash_toggle_high);
        activityVeryHigh = getActivity().findViewById(R.id.dash_toggle_very_high);
        activityLevelDescription = getActivity().findViewById(R.id.activity_description_view);
        activityMoreTextView = getActivity().findViewById(R.id.activity_more);

        // Location view references, updated based on device's location
        mLocationButton = getActivity().findViewById(R.id.locationButton);
        txtLong = getActivity().findViewById(R.id.long_coord);
        txtLat = getActivity().findViewById(R.id.lat_coord);

        // WBGT views
        locationErrorTxt = getActivity().findViewById(R.id.error_txt);

        recommendationView = getActivity().findViewById(R.id.ral);
        recommendationSmallView = getActivity().findViewById(R.id.ral_small);

        // Check whether onboarding has been completed
        // if onboarding steps still missing, start onboarding
        // Otherwise, check location permission and connect to openweathermap
        if (!onBoardingCompleted()) {
            startOnBoarding();

        } else {
            // Check whether app har permission to access location
            // If access granted, display location.
            // Otherwise prompt user for location settings change
            Log.v("HESTE", "DEVICE HAVE LOCATION ACCESS: " + deviceHasLocationPermission());
            if (deviceHasLocationPermission()) {
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
                if (activityVeryLow.isChecked()) {
                    updateActivityLevelView(activityVeryLow, "very low", getString(R.string.activity_very_low_text));
                } else {
                    setUncheckedColors(activityVeryLow);
                }
            }
        });

        activityLow.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityLow.isChecked()) {
                    updateActivityLevelView(activityLow, "low", getString(R.string.activity_low_text));
                } else {
                    setUncheckedColors(activityLow);
                }
            }
        });

        activityMedium.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityMedium.isChecked()) {
                    updateActivityLevelView(activityMedium, "medium", getString(R.string.activity_medium_text));
                } else {
                    setUncheckedColors(activityMedium);
                }
            }
        });

        activityHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityHigh.isChecked()) {
                    updateActivityLevelView(activityHigh, "high", getString(R.string.activity_high_text));
                } else {
                    setUncheckedColors(activityHigh);
                }
            }
        });

        activityVeryHigh.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (activityVeryHigh.isChecked()) {
                    updateActivityLevelView(activityVeryHigh, "very high", getString(R.string.activity_very_high_text));
                } else {
                    setUncheckedColors(activityVeryHigh);
                }
            }
        });
        // Activity level "more" click listener
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

        // Set activity level on start if checked
        setCheckedActivityLevel();
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
            preferences.edit().putString("activity_level", "medium").apply();
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

        // Update color indicator after activity level change
        ral = new RecommendedAlertLimit(preferences.getString("activity_level", null),
                preferences.getBoolean("Acclimatization", false));
        String color = ral.getRecommendationColor(preferences.getFloat("WBGT", 0), ral.calculateRALValue());

        // Set color in view based on RAL interval
        recommendationView.setColorFilter(Color.parseColor(color));
        recommendationSmallView.setColorFilter(Color.parseColor(color));
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
     *
     * @param requestCode
     * @param permissions  array of permissions
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
     *
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
     *
     * @return true if onboarding completed, false otherwise
     */
    private boolean onBoardingCompleted() {
        return preferences.getBoolean("onboarding_complete", false);
    }

    /**
     * Method to display the location in UI
     * Based on code from AndroidHive and Android Developer, heavily edited.
     * Checking whether location permission is given, provides option to grant permission if
     * not already granted.
     */
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

                            // Make lat/lon coordinates format, two decimal places
                            DecimalFormat df2 = new DecimalFormat(".##");

                            // Logic to get lat/lon from location object
                            latitude = df2.format(location.getLatitude());
                            longitude = df2.format(location.getLongitude());
                            //double altitude = location.getAltitude();

                            // Update view components
                            txtLong.setText(latitude);
                            txtLat.setText(longitude);

                            // Connect to weather API openweathermap.com using location coordinates
                            getOpenWeatherMapData(new Pair<String, String>(latitude, longitude));

                        } else {
                            setLocationViewVisibility(false);

                            // Show error message
                            //locationErrorTxt.setText(R.string.location_error_text);
                            AlertDialog.Builder alertDialog = new AlertDialog.Builder(getContext());

                            // Setting Dialog Title
                            alertDialog.setTitle("GPS turned off");
                            // Setting Dialog Message
                            alertDialog.setMessage("GPS is not enabled. Do you want to go to settings menu?");

                            // On pressing Settings button
                            alertDialog.setPositiveButton("Settings", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                                    getContext().startActivity(intent);
                                }
                            });

                            // on pressing cancel button
                            alertDialog.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    dialog.cancel();
                                }
                            });

                            // Showing Alert Message
                            alertDialog.show();
                            // Setting Dialog Message
                            alertDialog.setMessage("GPS is not enabled. Do you want to go to settings menu?");

                            // On pressing Settings button
                            alertDialog.setPositiveButton("Settings", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                                    getContext().startActivity(intent);
                                }
                            });
                        }
                    }
                });
    }

    /**
     * With device's location, fetch weather data from OpeanWeatherMap.com
     *
     * @param Coordinates lat/lon pair of location coordinates fetched from device
     */
    private void getOpenWeatherMapData(Pair<String, String> Coordinates) {
        APIConnection APIConn = new APIConnection("f22065144b2119439a589cbfb9d851d3", Coordinates, preferences, this);
        Log.v("HESTE", "API access string:\n" + APIConn.getAPIConnectionString());
        APIConn.execute();
    }

    /**
     * Set correct UI components according to whether location permission has been granted.
     * If permission, show coordinates, no error message
     * If not permission, show error message, no coordinates.
     *
     * @param locationFound boolean value determining how the dashboard view should look
     */
    private void setLocationViewVisibility(boolean locationFound) {
        if (locationFound) {
            locationErrorTxt.setVisibility(View.GONE);
            txtLat.setVisibility(View.VISIBLE);
            txtLong.setVisibility(View.VISIBLE);
        } else {
            locationErrorTxt.setVisibility(View.VISIBLE);
            txtLat.setVisibility(View.GONE);
            txtLong.setVisibility(View.GONE);
        }
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
                        "This device is not supported.", Toast.LENGTH_LONG)
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

}