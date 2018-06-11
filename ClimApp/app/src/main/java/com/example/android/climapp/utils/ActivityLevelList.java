package com.example.android.climapp.utils;

/**
 * Created by frksteenhoff on 11-06-2018.
 * Creating the setup for list of descriptions matching each activity level
 */

public class ActivityLevelList {

    /* Activity level short name */
    private int mActivityShortName;

    /* Activity description */
    private int mActivityDescription;

    /* Related art work */
    private int mImageId = NO_IMAGE_PROVIDED;
    private static final int NO_IMAGE_PROVIDED = -1;

    /* New ActivityLevelList object ID */
    public ActivityLevelList(int activityShortName, int activityDescription, int imageId) {
        mActivityShortName = activityShortName;
        mActivityDescription= activityDescription;
        mImageId = imageId;
    }

    /* AcvtivityLevelList constructor without image */
    public ActivityLevelList(int activityShortName, int activityDescription){
        mActivityShortName = activityShortName;
        mActivityDescription = activityDescription;
    }

    /** Get default translation of word */
    public int getActivityLevelShortname() {
        return mActivityShortName;
    }

    /** Get default translation of word */
    public int getActivityMainText() {
        return mActivityDescription;
    }

    public int getImage() {
        return mImageId;
    }

    public boolean hasImage() {
        return mImageId != NO_IMAGE_PROVIDED;
    }
}
