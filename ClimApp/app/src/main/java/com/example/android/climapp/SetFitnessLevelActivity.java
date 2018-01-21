package com.example.android.climapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.RatingBar;
import android.widget.Toast;

/**
 * Created by frksteenhoff on 21-01-2018.
 */

public class SetFitnessLevelActivity extends AppCompatActivity {
    public float FitnessLevel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fitness_level_settings);

        RatingBar fitnessRating = (RatingBar) findViewById(R.id.FitnessRating);
        fitnessRating.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
                FitnessLevel = v;
                Toast.makeText(getApplicationContext(), "Fitness Level updated to" + FitnessLevel, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
