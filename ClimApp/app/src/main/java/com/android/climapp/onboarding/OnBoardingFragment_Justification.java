package com.android.climapp.onboarding;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.DialogFragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.android.climapp.R;

/**
 * Created by frksteenhoff on 19-02-2018.
 * Inflating the onboarding fragment showing a justification as to why the user should input his/her
 * personal information.
 */

public class OnBoardingFragment_Justification extends DialogFragment {

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.onboard0_justification, container, false);
    }
}
