package com.android.climapp.data;

/**
 * @author frksteenhoff
 * Model class for the ClimApp Feedback to be pushed to databas.
 */

public class Feedback {
    private String user_id;
    private String created_on;
    private int type;
    private int rating;
    private String txt;

    public Feedback(String user_id, String created_on, int type, int rating, String txt){
        this.user_id = user_id;
        this.created_on = created_on;
        this.type = type;
        this.rating= rating;
        this.txt = txt;
    }

    public String getUserId(){
        return user_id;
    }

    public String getCreationDate() {
        return created_on;
    }

    public int getFeedbackType() {
        return type;
    }

    public double getRating(){
        return rating;
    }

    public String getText() {
        return txt;
    }
}
