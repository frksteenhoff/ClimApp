package com.example.android.climapp;

import android.app.Activity;
import android.support.v4.content.ContextCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import java.util.ArrayList;

/**
 * Created by frksteenhoff on 29-10-2017.
 */

public class WordAdapter {
    private int mBackgroundColor;

    public WordAdapter(Activity context, ArrayList<Word> words, int backgroundColor) {
        super(context, 0, words);
        mBackgroundColor = backgroundColor;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View listItemView = convertView;
        if(listItemView == null) {
            listItemView = LayoutInflater.from(getContext()).inflate(
                    R.layout.list_item, parent, false);
        }

        // Get the {@link AndroidFlavor} object located at this position in the list
        Word currentWord = getItem(position);

        // Find the TextView in the list_item.xml layout with the ID version_name
        TextView settingTextView = (TextView) listItemView.findViewById(R.id.setting_view);
        // Get the version name from the current AndroidFlavor object and
        // set this text on the name TextView
        settingTextView.setText(currentWord.getSetting());

        // Find the TextView in the list_item.xml layout with the ID version_number
        TextView settingValueTextView = (TextView) listItemView.findViewById(R.id.settingvalue_view);
        // Get the version number from the current AndroidFlavor object and
        // set this text on the number TextView
        settingValueTextView.setText(currentWord.getSettingValue());

        // Return the whole list item layout (containing 2 TextViews and an ImageView)
        // so that it can be shown in the ListView
        // Find the ImageView
        ImageView thumbnailImageView = (ImageView) listItemView.findViewById(R.id.image_view);

        /* Check whether image is provided for word object */
        if (currentWord.hasImage()) {
            // set this image on the correct ImageView
            thumbnailImageView.setImageResource(currentWord.getImage());
        } else {
            thumbnailImageView.setVisibility(View.GONE);
        }

        /* Set backgroundcolor */
        View textContainer = listItemView.findViewById(R.id.text_container);
        // Find resource id
        int color = ContextCompat.getColor(getContext(), mBackgroundColor);
        // Set background color
        textContainer.setBackgroundColor(color);

        return listItemView;
    }

}
