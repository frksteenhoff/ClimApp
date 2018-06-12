package com.example.android.climapp.onboarding;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.Spinner;

import com.example.android.climapp.R;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Making sure preferences chosen during onboarding is set correctly.
 */

public class OnBoardingFragment_Gender extends Fragment implements AdapterView.OnItemSelectedListener {

    private SharedPreferences preferences;
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard3_gender, container, false);
    }
    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {

        preferences = getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
        Spinner genderSpinner = getActivity().findViewById(R.id.set_gender);

        // Set gender -- female as default
        genderSpinner.setSelection(preferences.getInt("gender", 0));
        genderSpinner.setOnItemSelectedListener(this);
    }

    /**
     * Selecting correct spinner and saves its chosen value
     */
    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        if (position == 0) {
            // If female selected, show "female" in picker
            preferences.edit().putInt("gender", 0).apply();
        } else {
            // If UK units selected, show UK units in pickers
            preferences.edit().putInt("gender", 1).apply();
        }
    }

    /**
     * Setting default value for gender and unit
     * Default  gender: female
     * @param adapterView the adapter invoking the method
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        preferences.edit().putInt("gender", 0).apply();
    }
}
