package legacy;
/*
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.crashlytics.android.answers.Answers;
import com.example.android.climapp.DashboardActivity;
import com.example.android.climapp.R;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.GoogleApiClient;
import com.twitter.sdk.android.core.TwitterAuthConfig;
import com.twitter.sdk.android.core.TwitterCore;
import com.twitter.sdk.android.core.TwitterException;
import com.twitter.sdk.android.core.TwitterSession;
import com.twitter.sdk.android.core.identity.TwitterLoginButton;

import java.util.concurrent.Callable;

import io.fabric.sdk.android.Fabric;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.crashlytics.android.answers.Answers;
import com.example.android.climapp.DashboardActivity;
import com.example.android.climapp.R;
//import com.facebook.CallbackManager;
//import com.facebook.FacebookCallback;
//import com.facebook.FacebookException;
//import com.facebook.FacebookSdk;
//import com.facebook.login.LoginManager;
//import com.facebook.login.LoginResult;
//import com.facebook.login.widget.LoginButton;
//import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
//import com.google.android.gms.auth.api.signin.GoogleSignInResult;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.twitter.sdk.android.core.Callback;
import com.twitter.sdk.android.core.Result;
import com.twitter.sdk.android.core.TwitterAuthConfig;
import com.twitter.sdk.android.core.TwitterCore;
import com.twitter.sdk.android.core.TwitterException;
import com.twitter.sdk.android.core.TwitterSession;
import com.twitter.sdk.android.core.identity.TwitterLoginButton;

import java.util.concurrent.Callable;

import io.fabric.sdk.android.Fabric;

/**
 * Created by frksteenhoff on 10-10-2017.
 *


import android.support.v7.app.AppCompatActivity;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.crashlytics.android.answers.Answers;
import com.example.android.climapp.DashboardActivity;
import com.example.android.climapp.R;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.GoogleApiClient;
import com.twitter.sdk.android.core.TwitterAuthConfig;
import com.twitter.sdk.android.core.TwitterCore;
import com.twitter.sdk.android.core.TwitterException;
import com.twitter.sdk.android.core.TwitterSession;
import com.twitter.sdk.android.core.identity.TwitterLoginButton;

import java.util.concurrent.Callable;

import io.fabric.sdk.android.Fabric;

public class SignInActivity extends AppCompatActivity {

    private static final int RC_SIGN_IN = 9001;

    private SignInButton mGoogleSignInButton;
    private LoginButton mFacebookSignInButton;
    private TwitterLoginButton mTwitterSignInButton;
    private TwitterAuthConfig authConfig;
    private Button mClimAppSignUp;

    private GoogleApiClient mGoogleApiClient;
    private CallbackManager mFacebookCallbackManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        authConfig = new TwitterAuthConfig("lPcEPVTOHSdQgfy22rxYlvz04",
                "Rd9yQ4B8dSffj025UJP8y3QQIbJvRO6eUv68jmgIhe1dUSdjNq");
        Fabric.with(this, new Answers(), new TwitterCore(authConfig));

        FacebookSdk.sdkInitialize(getApplicationContext());
        mFacebookCallbackManager = CallbackManager.Factory.create();

        // Set the content of the activity to use the activity_main.xml layout file
        setContentView(R.layout.activity_login);

        mClimAppSignUp = (Button) findViewById(R.id.climapp_signup);
        mClimAppSignUp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(SignInActivity.this, DashboardActivity.class);
                startActivity(intent);
                finish();
            }
        });

        // Signing in with Google
        mGoogleSignInButton = (SignInButton) findViewById(R.id.google_sign_in_button);
        mGoogleSignInButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                signInWithGoogle();
            }
        });

        // Signing in with Facebook
        mFacebookSignInButton = (LoginButton) findViewById(R.id.facebook_sign_in_button);
        mFacebookSignInButton.setReadPermissions("email", "user_location");
        mFacebookSignInButton.registerCallback(mFacebookCallbackManager,
                new FacebookCallback<LoginResult>() {
                    @Override
                    public void onSuccess(final LoginResult loginResult) {
                        handleSignInResult(new Callable<Void>() {
                            @Override
                            public Void call() throws Exception {
                                LoginManager.getInstance().logOut();
                                return null;
                            }
                        });
                        Toast.makeText(getApplicationContext(), R.string.signed_in, Toast.LENGTH_SHORT).show();
                        Intent dashboard = new Intent(SignInActivity.this, DashboardActivity.class);
                        startActivity(dashboard);
                    }

                    @Override
                    public void onCancel() {
                        Toast.makeText(getApplicationContext(), R.string.login_cancelled, Toast.LENGTH_SHORT).show();
                        handleSignInResult(null);
                    }

                    @Override
                    public void onError(FacebookException error) {
                        Toast.makeText(getApplicationContext(), R.string.login_error, Toast.LENGTH_SHORT).show();
                        Log.d(SignInActivity.class.getCanonicalName(), error.getMessage());
                        handleSignInResult(null);
                    }
                }
        );

        // Signing in with Twitter
        mTwitterSignInButton = (TwitterLoginButton) findViewById(R.id.twitter_sign_in_button);
        mTwitterSignInButton.setCallback(new Callback<TwitterSession>() {
            @Override
            public void success(final Result<TwitterSession> result) {
                handleSignInResult(new Callable<Void>() {
                    @Override
                    public Void call() throws Exception {
                        TwitterCore.getInstance().logOut();
                        return null;
                    }
                });
            }

            @Override
            public void failure(TwitterException e) {
                Log.d(SignInActivity.class.getCanonicalName(), e.getMessage());
                handleSignInResult(null);
            }
        });
    }

    private void signInWithGoogle() {
        if (mGoogleApiClient != null) {
            mGoogleApiClient.disconnect();
        }

        // Configure sign-in to request the user's ID, email address, and basic
        // profile. ID and basic profile are included in DEFAULT_SIGN_IN.
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        // Build a GoogleApiClient with access to the Google Sign-In API and the
        // options specified by gso.
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addApi(Auth.GOOGLE_SIGN_IN_API, gso)
                .build();

        final Intent signInIntent = Auth.GoogleSignInApi.getSignInIntent(mGoogleApiClient);
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            GoogleSignInResult result = Auth.GoogleSignInApi.getSignInResultFromIntent(data);

            if (result.isSuccess()) {
                final GoogleApiClient client = mGoogleApiClient;

                handleSignInResult(new Callable<Void>() {
                    @Override
                    public Void call() throws Exception {
                        if (client != null) {

                            Auth.GoogleSignInApi.signOut(client).setResultCallback(
                                    new ResultCallback<Status>() {
                                        @Override
                                        public void onResult(Status status) {
                                            Log.d(SignInActivity.class.getCanonicalName(),
                                                    status.getStatusMessage());
                                        // TODO: handle logout failures
                                        }
                                    }
                            );
                        }
                        return null;
                    }
                });

            } else {
                handleSignInResult(null);
            }
        } else if(TwitterAuthConfig.DEFAULT_AUTH_REQUEST_CODE == requestCode) {
            mTwitterSignInButton.onActivityResult(requestCode, resultCode, data);
        } else {
            mFacebookCallbackManager.onActivityResult(requestCode, resultCode, data);
        }
    }

    // Handling the result from trying to login w. Google or Facebook
    private void handleSignInResult(Callable<Void> logout) {
        if (logout == null) {
            // Login error
            Toast.makeText(getApplicationContext(), R.string.login_error, Toast.LENGTH_SHORT).show();
        } else {
            // Login success - open dashboard
            com.example.android.climapp.Application.getInstance().setLogoutCallable(logout);
            startActivity(new Intent(this, DashboardActivity.class));
        }
    }
}
*/