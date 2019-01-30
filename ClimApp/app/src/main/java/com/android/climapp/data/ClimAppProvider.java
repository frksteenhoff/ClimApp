package com.android.climapp.data;

import android.content.ContentProvider;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import com.android.climapp.data.ClimAppContract.ClimAppEntry;

/*
 * @author frksteenhoff
 * Content provider handling API requests
 * Currently not used in the app
 */

public class ClimAppProvider extends ContentProvider {

    public static final String LOG_TAG = ClimAppProvider.class.getSimpleName();
    private static final int PETS = 100;
    private static final int PET_ID = 101;


    private ClimAppDbHelper mDbHelper;

    private static final UriMatcher sUriMatcher = new UriMatcher((UriMatcher.NO_MATCH));

    static {
        sUriMatcher.addURI(ClimAppContract.CONTENT_AUTHORITY, ClimAppContract.PATH_DATA, PETS);
        sUriMatcher.addURI(ClimAppContract.CONTENT_AUTHORITY, ClimAppContract.PATH_DATA + "/#", PET_ID);
    }

    @Override
    public boolean onCreate() {
        mDbHelper = new ClimAppDbHelper(getContext());
        return true;
    }

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, @Nullable String[] projection, @Nullable String selection,
                        @Nullable String[] selectionArgs, @Nullable String sortOrder) {
        SQLiteDatabase database = mDbHelper.getReadableDatabase();

        Cursor cursor;

        int match = sUriMatcher.match(uri);
        switch (match) {
            case PETS:
                cursor = database.query(ClimAppEntry.TABLE_NAME, projection, selection,
                        selectionArgs, null, null, sortOrder);
                break;
            case PET_ID:
                selection = ClimAppEntry._ID + "=?";
                selectionArgs = new String[] {String.valueOf(ContentUris.parseId(uri))};

                cursor = database.query(ClimAppEntry.TABLE_NAME, projection, selection,
                        selectionArgs, null, null, sortOrder);
                break;
            default:
                throw new IllegalArgumentException("Cannot query unknown URI " +uri);
        }
        return cursor;
    }

    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {
        return null;
    }

    private Uri insertPet(Uri uri, ContentValues values) {

        SQLiteDatabase database = mDbHelper.getWritableDatabase();

        // Data sanitation
        sanitizeValues(values);

        long id = database.insert(ClimAppEntry.TABLE_NAME, null, values);

        if (id == -1) {
            Log.e(LOG_TAG, "Failed to insert row for " + uri);
        }
        // Once we know the ID of the new row in the table,
        // return the new URI with the ID appended to the end of it
        return ContentUris.withAppendedId(uri, id);
    }

    private void sanitizeValues(ContentValues values) {

        String age = values.getAsString(ClimAppEntry.COLUMN_AGE);
        if (age == null) {
            throw new IllegalArgumentException("Utils requires a name");
        }

        int gender = values.getAsInteger(ClimAppEntry.COLUMN_GENDER);
        if (!isValidGender(gender)) {
            throw new IllegalArgumentException("Utils requires a gender");
        }

        int height = values.getAsInteger(ClimAppEntry.COLUMN_HEIGHT);
        if (height < 0) {
            throw new IllegalArgumentException("Utils requires a weight");
        }

        int weight = values.getAsInteger(ClimAppEntry.COLUMN_WEIGHT);
        if (weight < 0) {
            throw new IllegalArgumentException("Utils requires a height");
        }

        int unit = values.getAsInteger(ClimAppEntry.COLUMN_WEIGHT);
        if (unit < 0) {
            throw new IllegalArgumentException("Utils requires preferred unit");
        }
    }

    private void sanitizeUpdateValues(ContentValues values) {

        if(values.containsKey(ClimAppEntry.COLUMN_AGE)) {
            String age = values.getAsString(ClimAppEntry.COLUMN_AGE);
            if (age == null) {
                throw new IllegalArgumentException("Utils requires a name");
            }
        }

        if(values.containsKey(ClimAppEntry.COLUMN_GENDER)) {
            int gender = values.getAsInteger(ClimAppEntry.COLUMN_GENDER);
            if (!isValidGender(gender)) {
                throw new IllegalArgumentException("Utils requires a gender");
            }
        }

        if(values.containsKey(ClimAppEntry.COLUMN_HEIGHT)) {
            int height = values.getAsInteger(ClimAppEntry.COLUMN_HEIGHT);
            if (height < 0) {
                throw new IllegalArgumentException("Utils requires a weight");
            }
        }

        if(values.containsKey(ClimAppEntry.COLUMN_WEIGHT)) {
            int weight = values.getAsInteger(ClimAppEntry.COLUMN_WEIGHT);
            if (weight < 0) {
                throw new IllegalArgumentException("Utils requires a height");
            }
        }
    }

    private boolean isValidGender(int gender) {
        return gender == ClimAppEntry.GENDER_FEMALE ||
                gender == ClimAppEntry.GENDER_MALE;
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues contentValues) {
        final int match = sUriMatcher.match(uri);
        switch (match) {
            case PETS:
                return insertPet(uri, contentValues);
            default:
                throw new IllegalArgumentException("Insertion is not supported for " + uri);
        }
    }

    @Override
    public int delete(@NonNull Uri uri, @Nullable String selection, @Nullable String[] selectionArgs) {
        SQLiteDatabase database = mDbHelper.getWritableDatabase();
        final int match = sUriMatcher.match(uri);

        switch (match) {
            case PETS:
                return database.delete(ClimAppEntry.TABLE_NAME, selection, selectionArgs);
            case PET_ID:
                selection = ClimAppEntry._ID + "=?";
                selectionArgs = new String[] {String.valueOf(ContentUris.parseId(uri))};
                return database.delete(ClimAppEntry.TABLE_NAME, selection, selectionArgs);
            default:
                throw new IllegalArgumentException("Deletion is not supported for " + uri);
        }
    }

    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues contentValues, @Nullable String selection, @Nullable String[] selectionArgs) {
        final int match = sUriMatcher.match(uri);

        switch (match) {
            case PETS:
                return updatePet(uri, contentValues, selection, selectionArgs);
            case PET_ID:
                selection = ClimAppEntry._ID + "=?";
                selectionArgs = new String[] {String.valueOf(ContentUris.parseId(uri))};
                return updatePet(uri, contentValues, selection, selectionArgs);
            default:
                throw new IllegalArgumentException("Update is not supported for " + uri);
        }
    }

    private int updatePet(Uri uri, ContentValues contentValues, String selection, String[] selectionArgs) {
        // Return 0 if no values provided
        if (contentValues.size() == 0) {
            return 0;
        } else { // Only sanitize if there are values to sanitize
            sanitizeUpdateValues(contentValues);
        }

        SQLiteDatabase database = mDbHelper.getWritableDatabase();

        return database.update(ClimAppEntry.TABLE_NAME, contentValues, selection, selectionArgs);
    }

}
