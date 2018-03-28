package com.example.android.climapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.DialogFragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.Spinner;

/**
 * Created by frksteenhoff on 19-02-2018.
 */

public class OnBoardingFragment_Units extends DialogFragment implements AdapterView.OnItemSelectedListener {

    private SharedPreferences preferences;
    private Spinner unitSpinner;
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard1_units, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
        unitSpinner = (Spinner) getActivity().findViewById(R.id.set_units);

        unitSpinner.setOnItemSelectedListener(this);
    }

    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        if (position == 0) {
            // If SI units selected, show SI units in picker
            preferences.edit().putInt("Unit", 0).commit();
        } else if (position == 1) {
            // If US units selected, show US units in picker
            preferences.edit().putInt("Unit", 1).commit();
        } else {
            // If UK units selected, show UK units in picker
            preferences.edit().putInt("Unit", 2).commit();
        }
    }

    /**
     * Setting default value for gender and unit
     * Default  gender: female
     * Default unit: System Internationale (m, kg, l)
     * @param adapterView
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        preferences.edit().putInt("Unit", 0).commit();
    }
}

