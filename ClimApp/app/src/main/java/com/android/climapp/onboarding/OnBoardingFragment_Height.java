package com.android.climapp.onboarding;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.android.climapp.R;

import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.UNIT;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Handling setting user's weight during onboarding
 */

public class OnBoardingFragment_Height extends Fragment {

    private TextView heightUnit;
    private SharedPreferences preferences;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard4_height, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);
        heightUnit = getActivity().findViewById(R.id.unit_text_height);
        setHeightUnit();
    }

    /**
     * Setting the unit in which to measure users height
     * 0 = SI units, cm
     * 1 = US units, inches
     * 2 = UK units, feet
     */
    private void setHeightUnit() {
        int preferredHeightUnit = preferences.getInt(UNIT, 0);
        switch (preferredHeightUnit) {
            case 0:
                heightUnit.setText(R.string.height_unit_si);
                break;
            case 1:
                heightUnit.setText(R.string.height_unit_us);
                break;
            default:
                heightUnit.setText(R.string.height_unit_uk);
                break;
        }
    }
}
