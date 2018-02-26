package com.example.android.climapp;

import android.content.Context;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;

/**
 * Created by frksteenhoff on 26-02-2018.
 */

public class PageAdapter extends FragmentPagerAdapter {

    public static final int PAGE_NUM = 3;
    private String tabTitles[] = new String[] { "Settings", "Dashboard", "Clothing"};
    private Context context;

    public PageAdapter(FragmentManager fm, Context context) {
        super(fm);
        this.context = context;
    }

    @Override
    public Fragment getItem(int position) {
        if (position == 0) {
            return new SettingsFragment();
        } else if (position == 1){
            return new DashboardFragment();
        } else {
            return new ClothingFragment();
        }
    }

    @Override
    public int getCount() {
        return PAGE_NUM;
    }

    @Override
    public CharSequence getPageTitle(int position) {
        // Generate title based on item position
        return tabTitles[position];
    }
}
