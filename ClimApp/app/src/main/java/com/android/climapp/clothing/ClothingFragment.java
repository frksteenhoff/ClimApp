package com.android.climapp.clothing;

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
import android.widget.TextView;

import com.android.climapp.R;

import static com.android.climapp.utils.SharedPreferencesConstants.APP_NAME;
import static com.android.climapp.utils.SharedPreferencesConstants.FIELD_OF_WORK;

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

public class ClothingFragment extends Fragment      implements AdapterView.OnItemSelectedListener {

    Spinner fieldOfWorkSpinner;
    HorizontalScrollView workSpecificView;
    TextView workSpecificText;
    private static SharedPreferences preferences;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.clothing_layout, container, false);
    }
    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);

        fieldOfWorkSpinner = getActivity().findViewById(R.id.field_of_work_spinner);
        workSpecificText = getActivity().findViewById(R.id.clothing_top);
        workSpecificView = getActivity().findViewById(R.id.construction_specific);

        // Set gender -- female as default
        fieldOfWorkSpinner.setSelection(preferences.getInt(FIELD_OF_WORK, 0));
        fieldOfWorkSpinner.setOnItemSelectedListener(this);
    }

    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
        switch (position) {
            case 1:
                // If construction selected
                preferences.edit().putInt(FIELD_OF_WORK, 1).apply();
                workSpecificView.setVisibility(View.VISIBLE);
                workSpecificText.setVisibility(View.VISIBLE);
                break;
            case 2:
                // If construction selected
                preferences.edit().putInt(FIELD_OF_WORK, 2).apply();
                workSpecificView.setVisibility(View.GONE);
                workSpecificText.setVisibility(View.GONE);
                break;
            case 3:
                // If construction selected
                preferences.edit().putInt(FIELD_OF_WORK, 3).apply();
                workSpecificView.setVisibility(View.GONE);
                workSpecificText.setVisibility(View.GONE);
                break;
            default:
                // If office selected or default
                preferences.edit().putInt(FIELD_OF_WORK, 0).apply();
                workSpecificView.setVisibility(View.GONE);
                workSpecificText.setVisibility(View.GONE);
        }
    }

    /**
     * Set office work as default
     * @param adapterView the adapter invoking the method
     */
    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {
        preferences.edit().putInt(FIELD_OF_WORK, 0).apply();
    }
}
