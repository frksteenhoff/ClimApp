package com.android.climapp.utils;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentStatePagerAdapter;

import com.android.climapp.dashboard.DashboardFragment;
import com.android.climapp.settings.SettingsFragment;

import static com.android.climapp.utils.ApplicationConstants.DASHBOARD;
import static com.android.climapp.utils.ApplicationConstants.SETTINGS;

/**
 * Created by frksteenhoff on 26-02-2018.
 * Handling logic for changing between the 3 main screens:
 * Settings, Dashboard and Clothing
 */

public class FragmentPagerAdapter extends FragmentStatePagerAdapter {

    private int mNumOfTabs;
    private static final int PAGE_NUM = 2;
    private String tabTitles[] = new String[] { SETTINGS, DASHBOARD,};// CLOTHING};

    public FragmentPagerAdapter(FragmentManager fm, int PAGE_NUM) {
        super(fm);
        this.mNumOfTabs = PAGE_NUM;
    }

    @Override
    public Fragment getItem(int position) {
        if (position == 0) {
            return new SettingsFragment();
        } else {
            return new DashboardFragment();
        } //else {
            //return new ClothingFragment();
        //}
    }

    @Override
    public int getCount() {
        return mNumOfTabs;
    }

    @Override
    public CharSequence getPageTitle(int position) {
        // Generate title based on item position
        return tabTitles[position];
    }
}
