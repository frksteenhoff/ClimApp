package com.android.climapp.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;

import com.android.climapp.R;
import com.android.climapp.data.Api;
import com.android.climapp.data.RequestHandler;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

import static com.android.climapp.utils.ApplicationConstants.APP_NAME;
import static com.android.climapp.utils.ApplicationConstants.CODE_GET_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.CODE_POST_REQUEST;
import static com.android.climapp.utils.ApplicationConstants.DB_QUESTION_ID;
import static com.android.climapp.utils.ApplicationConstants.DB_RATING1;
import static com.android.climapp.utils.ApplicationConstants.DB_RATING2;
import static com.android.climapp.utils.ApplicationConstants.DB_RATING3;
import static com.android.climapp.utils.ApplicationConstants.DB_TXT;
import static com.android.climapp.utils.ApplicationConstants.DB_USER_ID;
import static com.android.climapp.utils.ApplicationConstants.GUID;

public class FeedbackActivity extends AppCompatActivity {

    SharedPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.feedback_questions);

        preferences = getSharedPreferences(APP_NAME, MODE_PRIVATE);

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
                addFeedbackToDB(mRatingBarHydration.getRating(),
                        mRatingBarActivity.getRating(),
                        mRatingBarClothing.getRating(),
                        mFeedback.getText().toString());
                mFeedback.setText("");
                mRatingBarHydration.setRating(3);
                mRatingBarActivity.setRating(3);
                mRatingBarClothing.setRating(3);
            }
        });
    }

    /**
     * Sending the user feedback to the database
     * @param rating1 numeric rating value from the first question
     * @param rating2 numeric rating value from the second question
     * @param rating3 numeric rating value from the third question
     * @param text alternative text the user can choose to provide
     */
    private void addFeedbackToDB(float rating1, float rating2, float rating3, String text) {
        HashMap<String, String> params = new HashMap<>();
        params.put(DB_USER_ID, preferences.getString(GUID, null));
        params.put(DB_QUESTION_ID, "1"); // Will be used when dynamic feedback is implemented
        params.put(DB_RATING1, Float.toString(rating1));
        params.put(DB_RATING2, Float.toString(rating2));
        params.put(DB_RATING3, Float.toString(rating3));
        params.put(DB_TXT, text);

        PerformNetworkRequest request = new PerformNetworkRequest(Api.URL_ADD_FEEDBACK, params, CODE_POST_REQUEST);
        request.execute();
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

    /*
     * Network request to connect API with database
     * */
    private class PerformNetworkRequest extends AsyncTask<Void, Void, String> {
        String url;
        HashMap<String, String> params;
        int requestCode;

        PerformNetworkRequest(String url, HashMap<String, String> params, int requestCode) {
            this.url = url;
            this.params = params;
            this.requestCode = requestCode;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            try {
                JSONObject object = new JSONObject(s);
                if (!object.getBoolean("error")) {
                    Log.v("HESTE", object.getString("message"));
                    Toast.makeText(FeedbackActivity.this, R.string.feedback_thanks, Toast.LENGTH_SHORT).show();

                } else {
                    Log.v("HESTE", "PHP response message: " + object.getString("message"));
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        @Override
        protected String doInBackground(Void... voids) {
            RequestHandler requestHandler = new RequestHandler();

            if (requestCode == CODE_POST_REQUEST) {
                return requestHandler.sendPostRequest(url, params);
            }

            if (requestCode == CODE_GET_REQUEST) {
                return requestHandler.sendGetRequest(url);
            }
            return null;
        }
    }
}
