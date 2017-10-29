package com.example.android.climapp;

import java.util.concurrent.Callable;

/**
 * Created by frksteenhoff on 28-10-2017.
 */

public class Application {
    private static Application ourInstance = new Application();

    public static Application getInstance() {
        return ourInstance;
    }

    private Callable<Void> mLogoutCallable;

    private Application() {
    }

    public void setLogoutCallable(Callable<Void> callable) {
        mLogoutCallable = callable;
    }

}
