package com.example.android.climapp.dashboard;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.widget.ListView;

import com.example.android.climapp.R;
import com.example.android.climapp.utils.ActivityLevelList;
import com.example.android.climapp.utils.ActivityLevelListAdapter;

import java.util.ArrayList;

/**
 * Created by frksteenhoff on 25-04-2018.
 * Thorough descriptions of all activity levels
 * Using activity_list.xml as base for the list structure
 * Giving each list item the layout shown in activity_level_item.xml
 */

public class ActivityLevelListActivity extends AppCompatActivity {

    private ListView listView;
    private static ActivityLevelListAdapter adapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list);

        listView = (ListView) findViewById(R.id.list);

        // Initilializing array for english digits 1 through 10
        final ArrayList<ActivityLevelList> levels = new ArrayList<ActivityLevelList>();
        levels.add(new ActivityLevelList(R.string.activity_level_very_low, R.string.activity_very_low_text, R.mipmap.rest));
        levels.add(new ActivityLevelList(R.string.activity_level_low, R.string.activity_low_text, R.mipmap.office));
        levels.add(new ActivityLevelList(R.string.activity_level_medium, R.string.activity_medium_text, R.mipmap.gardener));
        levels.add(new ActivityLevelList(R.string.activity_level_high, R.string.activity_high_text, R.mipmap.shovel));
        levels.add(new ActivityLevelList(R.string.activity_level_very_high, R.string.activity_very_high_text, R.mipmap.running));

        /* Adding array elements to the screen */
        adapter = new ActivityLevelListAdapter(this, levels);
        listView.setAdapter(adapter);

    }
}
