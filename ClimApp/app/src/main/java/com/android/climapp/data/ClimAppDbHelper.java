package com.android.climapp.data;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import com.android.climapp.data.ClimAppContract.ClimAppEntry;

/*
 * @author frksteenhoff
 * Database helper class created for the purpose of handling local SQLite3 database
 * Currently not used in the app
 */

public class ClimAppDbHelper extends SQLiteOpenHelper {

    public static final String LOG_TAG = ClimAppDbHelper.class.getSimpleName();

    public static final int DATABASE_VERSION = 1;
    public static final String DATABASE_NAME = "climapp.db";

    public ClimAppDbHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    public void onCreate(SQLiteDatabase db){
        String SQL_CREATE_PET_ENTRIES =  "CREATE TABLE " + ClimAppEntry.TABLE_NAME + " ("
                + ClimAppEntry._ID + " INTEGER PRIMARY KEY, "
                + ClimAppEntry.COLUMN_AGE + " TEXT, "
                + ClimAppEntry.COLUMN_GENDER + " INTEGER, "
                + ClimAppEntry.COLUMN_HEIGHT + " INTEGER, "
                + ClimAppEntry.COLUMN_WEIGHT + " INTEGER, "
                + ClimAppEntry.COLUMN_UNIT + " INTEGER NOT NULL DEFAULT 0);";

        db.execSQL(SQL_CREATE_PET_ENTRIES);
    }

    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        String SQL_DELETE_PET_ENTRIES = "DELETE FROM " + ClimAppEntry.TABLE_NAME + ";";
        db.execSQL(SQL_DELETE_PET_ENTRIES);
        onCreate(db);
    }

    /*
     * Possibly not needed
     */
    public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        onUpgrade(db, oldVersion, newVersion);
    }
}
