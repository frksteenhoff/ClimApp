package com.android.climapp.onboarding;

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

import com.android.climapp.R;
import com.android.climapp.utils.Utils;

import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.UNIT;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Handling the utils setting preferred unit
 */

public class OnBoardingFragment_Units extends DialogFragment implements AdapterView.OnItemSelectedListener {

    private SharedPreferences preferences;
    private Spinner unitSpinner;
    private Utils utils;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard1_units, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);

        utils = new Utils(preferences);
        unitSpinner = getActivity().findViewById(R.id.set_units);

        unitSpinner.setOnItemSelectedListener(this);
    }

    /* Save the chosen unit based on position
     // 0 - SI unit
     // 1 - US metric system
     // 2 - UK metric system
    */
    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        preferences.edit().putInt(UNIT, position).apply();
        utils.setUnit(position);
    }

    /**
     * Setting default value for gender and unit
     * Default unit: System Internationale (m, kg, l)
     * @param adapterView the adapter that invoked the method
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        preferences.edit().putInt(UNIT, 0).apply();
    }
}

