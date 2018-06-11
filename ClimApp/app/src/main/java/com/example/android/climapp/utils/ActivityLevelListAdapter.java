package com.example.android.climapp.utils;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.android.climapp.R;

import java.util.ArrayList;

/**
 * Created by frksteenhoff on 11-06-2018.
 * Defining how read in custom arraylist parameters correctly to view
 */

public class ActivityLevelListAdapter extends ArrayAdapter<ActivityLevelList> {

    public ActivityLevelListAdapter(Activity context, ArrayList<ActivityLevelList> texts) {
        super(context, R.layout.activity_level_item, texts);
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View listItemView = convertView;
        if(listItemView == null) {
            listItemView = LayoutInflater.from(getContext()).inflate(
                    R.layout.activity_level_item, parent, false);
        }
        // Get the {@link AndroidFlavor} object located at this position in the list
        ActivityLevelList currentActivity = getItem(position);

        // Find the TextView in the activity_level_item.xml layout with the ID version_name
        TextView activityLevelShortname = (TextView) listItemView.findViewById(R.id.activity_level_shortname_view);

        // Get the version name from the current AndroidFlavor object and
        // set this text on the name TextView
        activityLevelShortname.setText(currentActivity.getActivityLevelShortname());

        // Find the TextView in the list_item.xml layout with the ID version_number
        TextView activityLevelDescription = (TextView) listItemView.findViewById(R.id.activity_level_main_text_view);

        // Get the version number from the current AndroidFlavor object and set this text on the number TextView
        activityLevelDescription.setText(currentActivity.getActivityMainText());

        // Find the ImageView
        ImageView activityLevelImage = (ImageView) listItemView.findViewById(R.id.activity_level_image_view);

        /* Check whether image is provided for activitylevellist object */
        if (currentActivity.hasImage()) {
            // set this image on the correct ImageView
            activityLevelImage.setImageResource(currentActivity.getImage());
        } else {
            activityLevelImage.setVisibility(View.GONE);
        }
        // Return the whole list item layout (containing 2 TextViews and an ImageView)
        return listItemView;
    }
}
