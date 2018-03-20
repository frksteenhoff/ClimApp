package com.example.android.climapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.RatingBar;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class SetFitnessLevelActivity extends AppCompatActivity {

    SharedPreferences preferences;
    SharedPreferences.Editor editor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings_fitness_level);

        preferences = getSharedPreferences("ClimApp", MODE_PRIVATE);
        editor = preferences.edit();

        // Rating bar, setting initial value
        RatingBar fitnessRating = (RatingBar) findViewById(R.id.FitnessRating);
        fitnessRating.setRating(preferences.getFloat("Fitness", 0));

        fitnessRating.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float newLevel, boolean b) {
                editor.putFloat("Fitness", newLevel);
                editor.commit();
                Toast.makeText(getApplicationContext(), getString(R.string.fitness_updated) + " " + newLevel, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
