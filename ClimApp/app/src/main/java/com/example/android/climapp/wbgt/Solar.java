package com.example.android.climapp.wbgt;

/**
 * Created by frksteenhoff on 14-04-2018.
 */
import java.util.Calendar;

public class Solar {

    private double longitude, latitude, latitudeRad, EOT, gamma, declin, ha, utcOffset, cos_zenith, azimuth, timeOffset, tst, tstNOAA, zenith;
    private double dayOfYear, minute, correctedHour;
    private int year, month, dayOfMonth, hour, gmt;
    private Calendar calendar;
    private final int JGREG = 15 + 31*(10+12*1582);

    public Solar(double longitude, double latitude, Calendar calendar, int utcOffset) {
        this.longitude = longitude;
        this.latitude = latitude;
        latitudeRad = Math.toRadians(latitude);
        this.calendar = calendar;
        this.utcOffset = utcOffset;

        calculateTime();
    }

    private void calculateTime() {
        year = calendar.get(Calendar.YEAR);
        dayOfYear = calendar.get(Calendar.DAY_OF_YEAR);
        dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH);
        month = calendar.get(Calendar.MONTH) + 1;
        hour = calendar.get(Calendar.HOUR_OF_DAY);
        minute = calendar.get(Calendar.MINUTE);
        correctedHour = hour - utcOffset;
    }

    private void setCalendar(Calendar calendar) {
        this.calendar = calendar;
        calculateTime();
    }

    private void utcOffset(int utcOffset) {
        this.utcOffset = utcOffset;
        calculateTime();
    }

    private void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    private void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    // True solar time in minutes from midnight
    private double tst() {
        tst = correctedHour*60 + minute;
        return tst / 60.0;
    }

    private double toJulian() { // http://www.rgagnon.com/javadetails/java-0506.html
        // ref : Numerical Recipes in C, 2nd ed., Cambridge University Press 1992
        int julianYear = year;
        if (year < 0) julianYear++;
        int julianMonth = month;
        if (month > 2) {
            julianMonth++;
        } else {
            julianYear--;
            julianMonth += 13;
        }

        double julian = (Math.floor(365.25 * julianYear)
                + Math.floor(30.6001*julianMonth) + dayOfMonth + 1720995.0);

        if (dayOfMonth + 31 * (month + 12 * year) >= JGREG) {
            // change over to Gregorian calendar
            int ja = (int)(0.01 * julianYear);
            julian += 2 - ja + (0.25 * ja);
        }
        julian += (correctedHour - 12) / 24.;
        return julian;
    }

    private double julianCentury() {
        return ((toJulian() - 2451545) / 36525); //Subtracted Julian Date of 1 January 2000 12:00
    }

    private double sunGeomAnom() { //Geometric mean anomaly of the sun (degrees)
        return 357.52911 + julianCentury()*(35999.05029 - 0.0001537*julianCentury()); // degrees
    }

    private double sunEquationCenter() {
        return Math.sin(Math.toRadians(sunGeomAnom()))*(1.914602 - julianCentury()*(0.004817 + 0.000014*julianCentury())) + Math.sin(Math.toRadians(2*sunGeomAnom()))*(0.019993 - 0.000101*julianCentury()) + Math.sin(Math.toRadians(3*sunGeomAnom()))*0.000289;
    }

    private double sunTrueAnom() { // Sun true anomaly (degrees)
        return sunGeomAnom() + sunEquationCenter();
    }

    private double eccentEarthOrbit() {  //Orbital eccentricity of the Earth (0 means perfect circular orbit)
        return 0.016708634 - julianCentury()*(0.000042037 + 0.0000001267*julianCentury());
    }

    private double sunEarthDistance() { // Distance between Earth and the sun in Astronomical Units (1 AU = 149 597 871 kilometers)
        return (1.000001018*(1 - Math.pow(eccentEarthOrbit(), 2))) / (1 + eccentEarthOrbit()*Math.cos(Math.toRadians(sunTrueAnom())));
    }

    //True solar time in minutes after midnight. Ref. NOAA General Solar Position Calculations
    private double tstNOAA() {
        tstNOAA = hour*60 + minute + timeOffset();
        return tstNOAA;
    }

    //According to NOAA General Solar Position Calculations
    private double timeOffset() {
        timeOffset = equationOfTime() + 4*longitude - utcOffset*60;
        return timeOffset;
    }

    //Equation of time in minutes. Ref. NOAA General Solar Position Calculations
    private double equationOfTime() {
        EOT = 229.18 * (0.000075 + 0.001868*Math.cos(gamma()) - 0.032077*Math.sin(gamma()) - 0.014615*Math.cos(2*gamma()) - 0.040849*Math.sin(2*gamma()));
        return EOT;
    }

    //Fractional year (Radians). Ref. NOAA General Solar Position Calculations
    private double gamma() {
        int denom;

        //Determine number of days in year
        denom = (leapYear(year)) ? 366 : 365;

        gamma = (2*Math.PI / denom) * (dayOfYear - 1 + hour / 24); //NB: 24-hr time format. If AM/PM subtract 12 from hour
        return gamma;
    }

    //Solar declination (Radians). Ref.: NOAA General Solar Position Calculations and declination - is reckoned as the angle from the celestial equator to the object (the sun)(positive north),
    private double declination() {
        declin = 0.006918 - 0.399912*Math.cos(gamma()) + 0.070257*Math.sin(gamma()) - 0.006758*Math.cos(2*gamma()) + 0.000907*Math.sin(2*gamma()) - 0.002697*Math.cos(3*gamma()) + 0.00148*Math.sin(3*gamma());
        return declin;
    }

    //Solar hour angle (Radians). Ref. NOAA General Solar Position Calculations
    private double ha() {
        ha = Math.toRadians(tstNOAA()/4 - 180);
        return ha;
    }

    //Solar zenith angle (Radians). Ref. NOAA General Solar Position Calculations
    public double zenith() {
        zenith = Math.acos( Math.sin(latitudeRad)*Math.sin(declination()) + Math.cos(latitudeRad)*Math.cos(declination())*Math.cos(ha()) );
        return zenith;
    }

    //Solar azimuth (degrees clockwise from north)
    private double azimuth() {
        azimuth =   Math.toDegrees( Math.acos( (Math.sin(declination()) - Math.sin(latitudeRad)*Math.cos(zenith())) / (Math.cos(latitudeRad) * Math.sin(zenith()) ))) ;
        return azimuth;
    }

    private double altitude() {
        return 0;
    }

    private boolean leapYear(double y) {
        return (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0));
    }

    private void printAll() {
        System.out.println("--------------------------------------------------------------------------------------");
        System.out.println("Måned: " + (calendar.get(Calendar.MONTH) + 1) + " Dag nr.: " + dayOfYear + " UT: " + correctedHour);
        System.out.println("Time offset: " + timeOffset);
        System.out.println("Gamma: " + gamma());
        System.out.println("True solar time (NOAA): " + tstNOAA);
        System.out.println("timeOffset: " + timeOffset);
        System.out.println("Equation of time: " + EOT);
        System.out.println("Declination: " + Math.toDegrees(declin));
        System.out.println("Solar hour angle: " + ha + " rad " + Math.toDegrees(ha) + " deg");
        System.out.println("Zenith angle: " + zenith + " rad " + Math.toDegrees(zenith) + " deg");
        System.out.println("Azimuth: " + azimuth);
        System.out.println("Julian date:" + toJulian());
        System.out.println("Julian century:" + julianCentury());
        System.out.println("Geom anom sun :" + sunGeomAnom());
        System.out.println("Sun equation center: " + sunEquationCenter());
        System.out.println("Sun true anomaly: " + sunTrueAnom());
        System.out.println("Eccent Earth orbit: " + eccentEarthOrbit());
        System.out.println("Earth - sun distance (astronomical units): " + sunEarthDistance() + " AU");
    }


}
