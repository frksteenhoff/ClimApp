package com.example.android.climapp;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ListView;

import java.util.ArrayList;

/**
 * Created by frksteenhoff on 10-10-2017.
 */

public class SettingsFragment extends Fragment {

    public SettingsFragment() {
        // Required empty public constructor
    }

    // Initializing user input values
    public String Gender;
    public int Age;
    public int Height;
    public int Weight;
    public int FitnessLevel;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View rootView = inflater.inflate(R.layout.info_list, container, false);

        // Initilializing array for each user setting
        final ArrayList<InfoList> items = new ArrayList<InfoList>();
        items.add(new InfoList("Gender", "None", R.drawable.common_plus_signin_btn_text_light));
        items.add(new InfoList("Age", "0", R.drawable.common_plus_signin_btn_text_light));
        items.add(new InfoList("Height", "170", R.drawable.common_plus_signin_btn_text_light));
        items.add(new InfoList("Weigth", "70", R.drawable.common_plus_signin_btn_text_light));
        items.add(new InfoList("FitnessLevel", "0.5", R.drawable.common_plus_signin_btn_text_light));

         /* Adding array elements to the screen */
        InfoListAdapter adapter = new InfoListAdapter(getActivity(), items, R.color.colorPrimaryDark);

        ListView listView = (ListView) rootView.findViewById(R.id.list);

        listView.setAdapter(adapter);

        /* Deciding action on click */
        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long l) {
                InfoList item = items.get(position);
            }
        });

        return rootView;
    }
}

