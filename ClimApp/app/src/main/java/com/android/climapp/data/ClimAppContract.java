package com.android.climapp.data;

import android.net.Uri;
import android.provider.BaseColumns;


/*
 * @author frksteenhoff
 * Contract created for the purpose of handling local SQLite3 database
 * Currently not used in the app
 */

public class ClimAppContract {

    private ClimAppContract() {

    }

    public static final String CONTENT_AUTHORITY = "com.android.climapp";
    public static final Uri BASE_CONTENT_URI = Uri.parse("content://" + CONTENT_AUTHORITY);
    public static final String PATH_DATA = "climapp";

    public static final class ClimAppEntry implements BaseColumns {

        public static final Uri CONTENT_URI = Uri.withAppendedPath(BASE_CONTENT_URI, PATH_DATA);

        public static final String TABLE_NAME = "user";
        public static final String _ID = BaseColumns._ID;
        public static final String COLUMN_AGE = "age";
        public static final String COLUMN_GENDER = "gender";
        public static final String COLUMN_HEIGHT = "height";
        public static final String COLUMN_WEIGHT = "weight";
        public static final String COLUMN_UNIT = "unit";

        /**
         * Possible gender values
         */
        public static final int GENDER_MALE = 0;
        public static final int GENDER_FEMALE = 1;

        /**
         * Possible unit values
         */
        public static final int UNIT_SI = 0;
        public static final int UNIT_US = 1;
        public static final int UNIT_UK = 2;
    }
}