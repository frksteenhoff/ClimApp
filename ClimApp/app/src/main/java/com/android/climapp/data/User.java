package com.android.climapp.data;

public class User {
    private int _id;
    private String age;
    private int gender;
    private double height;
    private double weight;
    private int unit;

    public User(int _id, String age, int gender, double height, double weight, int unit){
        this._id = _id;
        this.age = age;
        this.gender = gender;
        this.height = height;
        this.weight = weight;
        this.unit = unit;
    }

    public int getId(){
        return _id;
    }

    public String getAge() {
        return age;
    }

    public int getGender() {
        return gender;
    }

    public double getHeight(){
        return height;
    }

    public double getWeight() {
        return weight;
    }

    public int getUnit() {
        return unit;
    }
}
