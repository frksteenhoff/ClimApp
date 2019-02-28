package com.android.climapp.settings;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;

public class FeedbackActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.feedback_questions);

        final RatingBar mRatingBarHydration = (RatingBar) findViewById(R.id.rating_hydration);
        final RatingBar mRatingBarActivity = (RatingBar) findViewById(R.id.rating_activity);
        final RatingBar mRatingBarClothing = (RatingBar) findViewById(R.id.rating_clothing);
        final TextView mRatingScaleHydration = (TextView) findViewById(R.id.ratingScaleHydration);
        final TextView mRatingScaleActivity = (TextView) findViewById(R.id.ratingScaleActivity);
        final TextView mRatingScaleClothing = (TextView) findViewById(R.id.ratingScaleClothing);
        final EditText mFeedback = (EditText) findViewById(R.id.feedback_text);
        Button mSendFeedback = (Button) findViewById(R.id.button_submit);

        mRatingBarHydration.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
                mRatingScaleHydration.setText(String.valueOf(v));
                switch ((int) ratingBar.getRating()) {
                    case 1:
                        mRatingScaleHydration.setText(R.string.rating_1_hydration);
                        break;
                    case 2:
                        mRatingScaleHydration.setText(R.string.rating_2_hydration);
                        break;
                    case 3:
                        mRatingScaleHydration.setText(R.string.rating_3_hydration);
                        break;
                    case 4:
                        mRatingScaleHydration.setText(R.string.rating_4_hydration);
                        break;
                    case 5:
                        mRatingScaleHydration.setText(R.string.rating_5_hydration);
                        break;
                    default:
                        mRatingScaleHydration.setText("");
                }
            }
        });

        mRatingBarActivity.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
                mRatingScaleActivity.setText(String.valueOf(v));
                switch ((int) ratingBar.getRating()) {
                    case 1:
                        mRatingScaleActivity.setText(R.string.rating_1_activity);
                        break;
                    case 2:
                        mRatingScaleActivity.setText(R.string.rating_2_activity);
                        break;
                    case 3:
                        mRatingScaleActivity.setText(R.string.rating_3_activity);
                        break;
                    case 4:
                        mRatingScaleActivity.setText(R.string.rating_4_activity);
                        break;
                    case 5:
                        mRatingScaleActivity.setText(R.string.rating_5_activity);
                        break;
                    default:
                        mRatingScaleActivity.setText("");
                }
            }
        });

        mRatingBarClothing.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
                mRatingScaleClothing.setText(String.valueOf(v));
                switch ((int) ratingBar.getRating()) {
                    case 1:
                        mRatingScaleClothing.setText(R.string.rating_1_clothing);
                        break;
                    case 2:
                        mRatingScaleClothing.setText(R.string.rating_2_clothing);
                        break;
                    case 3:
                        mRatingScaleClothing.setText(R.string.rating_3_clothing);
                        break;
                    case 4:
                        mRatingScaleClothing.setText(R.string.rating_4_clothing);
                        break;
                    case 5:
                        mRatingScaleClothing.setText(R.string.rating_5_clothing);
                        break;
                    default:
                        mRatingScaleClothing.setText("");
                }
            }
        });

        // Set default rating as three stars for all ratingBars
        mRatingBarHydration.setRating(3);
        mRatingBarActivity.setRating(3);
        mRatingBarClothing.setRating(3);

        mSendFeedback.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mFeedback.setText("");
                mRatingBarHydration.setRating(3);
                mRatingBarActivity.setRating(3);
                mRatingBarClothing.setRating(3);
                Toast.makeText(FeedbackActivity.this, R.string.feedback_thanks, Toast.LENGTH_SHORT).show();
            }
        });
    }

    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                Intent parentIntent = NavUtils.getParentActivityIntent(this);
                parentIntent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(parentIntent);
                finish();
                return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
