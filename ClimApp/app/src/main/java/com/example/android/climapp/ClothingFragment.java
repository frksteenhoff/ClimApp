package com.example.android.climapp;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

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

public class ClothingFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.clothing_layout, container, false);
    }
}
