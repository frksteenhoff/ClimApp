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

import static com.android.climapp.utils.SharedPreferencesConstants.APP_NAME;
import static com.android.climapp.utils.SharedPreferencesConstants.UNIT;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Handling setting user's weight during onboarding
 */

public class OnBoardingFragment_Weight extends Fragment {

    private TextView weightUnit;
    private SharedPreferences preferences;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard5_weight, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences(APP_NAME, Context.MODE_PRIVATE);
        weightUnit = getActivity().findViewById(R.id.unit_text_weight);
        setWeightUnit();
    }

    /**
     * Setting the unit in which to measure users weight
     * 0 = SI units, kg
     * 1 = US units, pounds
     * 2 = UK units, stones
     */
    private void setWeightUnit() {
        int preferredWeightUnit = preferences.getInt(UNIT, 0);
        switch (preferredWeightUnit) {
            case 0:
                weightUnit.setText(R.string.weight_unit_si);
                break;
            case 1:
                weightUnit.setText(R.string.weight_unit_us);
                break;
            default:
                weightUnit.setText(R.string.weight_unit_uk);
                break;
        }
    }
}
