package com.example.android.climapp.onboarding;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.DialogFragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.android.climapp.R;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Inflating the onboarding fragment where the user sets his/her age.
 */

public class OnBoardingFragment_Age extends DialogFragment {

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard2_age, container, false);
    }
}
