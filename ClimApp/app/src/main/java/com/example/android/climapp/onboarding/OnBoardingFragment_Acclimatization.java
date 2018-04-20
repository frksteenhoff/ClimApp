package com.example.android.climapp.onboarding;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.Switch;

import com.example.android.climapp.R;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Making sure the choice for acclimatization is saved to shared preferences during onboarding.
 */

public class OnBoardingFragment_Acclimatization extends Fragment {

    private SharedPreferences preferences;
    private Switch acclimatization;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard6_acclimatization, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        preferences = getActivity().getSharedPreferences("ClimApp", Context.MODE_PRIVATE);
        acclimatization = getActivity().findViewById(R.id.set_acclimatization);

        acclimatization.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                acclimatization.setChecked(isChecked);
                preferences.edit().putBoolean("Acclimatization", true).apply();

            }
        });
    }
}
