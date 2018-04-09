package com.example.android.climapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.HorizontalScrollView;
import android.widget.Spinner;

/**
 * Created by frksteenhoff on 26-02-2018.
 * Choosing work specific attire in order to more accurately calculate the user's clo-value
 *
 * All current assets are from www.flaticon.com
 * Special credits to:
 * - Freepik    - http://www.freepik.com/
 * - Smashicons - http://www.smashicons.com/
 * Made available under Creative Commons License BY 3.0
 */

public class ClothingFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    Spinner fieldOfWorkSpinner;
    HorizontalScrollView workSpecificView;
    private static SharedPreferences preferences;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.clothing_layout, container, false);
    }
    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);

        fieldOfWorkSpinner = getActivity().findViewById(R.id.field_of_work_spinner);
        workSpecificView = getActivity().findViewById(R.id.construction_specific);

        // Set gender -- female as default
        fieldOfWorkSpinner.setSelection(preferences.getInt("field_of_work", 0));
        fieldOfWorkSpinner.setOnItemSelectedListener(this);
    }

    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        switch (position) {
            case 1:
                // If construction selected
                preferences.edit().putInt("field_of_work", 1).apply();
                workSpecificView.setVisibility(View.VISIBLE);
                break;
            case 2:
                // If construction selected
                preferences.edit().putInt("field_of_work", 2).apply();
                workSpecificView.setVisibility(View.GONE);
                break;
            case 3:
                // If construction selected
                preferences.edit().putInt("field_of_work", 3).apply();
                workSpecificView.setVisibility(View.GONE);
                break;
            default:
                // If office selected or default
                preferences.edit().putInt("field_of_work", 0).apply();
                workSpecificView.setVisibility(View.GONE);
        }
    }

    /**
     * Set office work as default
     * @param adapterView the adapter invoking the method
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        preferences.edit().putInt("field_of_work", 0).apply();
    }
}
