package com.android.climapp;

import com.android.climapp.wbgt.RecommendedAlertLimitISO7243;
import com.android.climapp.wbgt.Solar;
import com.android.climapp.wbgt.SolarRad;
import com.android.climapp.wbgt.WBGT;

import org.junit.Test;

import java.util.Calendar;
import java.util.GregorianCalendar;

import static com.android.climapp.utils.ApplicationConstants.COLOR_GREEN;
import static com.android.climapp.utils.ApplicationConstants.COLOR_ORANGE;
import static com.android.climapp.utils.ApplicationConstants.COLOR_RED;
import static junit.framework.Assert.assertEquals;

/**
 * Created by frksteenhoff on 14-05-2018.
 * Testing the values provided when calculating the recommended reference limit based on ISO 7243
 * More redundant code than necessary, minimizing not prioritized at this moment
 */

public class RALISO7243Test {
    // Activity level
    private String activityLevel;
    // Height
    private String height = "1.80";
    // Weight
    private int weight = 80;

    // FOR WBGT CALCULATIONS
    private GregorianCalendar cal = (GregorianCalendar) GregorianCalendar.getInstance();

    private Calendar calendar = Calendar.getInstance();
    private int utcOffset = (calendar.get(Calendar.ZONE_OFFSET) + calendar.get(Calendar.DST_OFFSET)) / (60 * 60000); // Total offset (geographical and daylight savings) from UTC in hours

    // All basic fields
    private int year = 2018;
    private int month = 10;
    private int day = 13;
    private int hour = 11; //Local time
    private int min = 0;

    private  int avg = 10;
    //        double solar = 200; //Solindstråling - only used when solar cannot be calculated
    private double pres = 1013; // barometric pressure, mb
    private double Tair = 12;
    private double relhum = 87; /* relative humidity, % */
    private double speed = 2; //Wind speed (m/s) measured in height zspeed m
    private double zspeed = 2;
    private double dT = 0; //Vertical temp difference

    private int urban = 0;
    // Smørum nedre
    double latitude = 55.74232;
    double longitude = 12.30276;


    @Test
    public void testReferenceLimitHigh() {
        activityLevel = "medium";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        assertEquals(299, Math.round(ral.getMetabolicRate()));
    }

    @Test
    public void testWBGTShouldBeRALGreen() {
        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, true, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);

        activityLevel = "very high";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        assertEquals(499, Math.round(ral.getMetabolicRate()));
        // Expected color: Green
        assertEquals(COLOR_GREEN, ral.getRecommendationColor(wbgt.getWBGT(), ral.calculateRALValue()));
        // Expected WBGT value
        assertEquals(15.6099, wbgt.getWBGT(), 0.0001);
        // Expected RAL value
        assertEquals(21.8555, ral.calculateRALValue(), 0.0001);
    }

    @Test
    public void testWBGTShouldBeRALOrange() {
        Tair = 15;
        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, true, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);

        activityLevel = "very high";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        assertEquals(499, Math.round(ral.getMetabolicRate()));
        // Expected color: orange
        assertEquals(COLOR_ORANGE, ral.getRecommendationColor(wbgt.getWBGT(), ral.calculateRALValue()));
        // Expected WBGT value
        assertEquals(18.3944, wbgt.getWBGT(), 0.0001);
        // Expected RAL value
        assertEquals(21.8555, ral.calculateRALValue(), 0.0001);
    }

    @Test
    public void testWBGTShouldBeRALRed() {
        Tair = 23;
        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, true, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);

        activityLevel = "medium";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        assertEquals(299, Math.round(ral.getMetabolicRate()));
        // Expected color: Red
        assertEquals(COLOR_RED, ral.getRecommendationColor(wbgt.getWBGT(), ral.calculateRALValue()));
        // Expected WBGT value
        assertEquals(25.8685, wbgt.getWBGT(), 0.0001);
        // Expected RAL value
        assertEquals(24.9836, ral.calculateRALValue(), 0.0001);
    }

    @Test
    public void testWBGTColderWeatherShouldBeRALGreen() {
        Tair = 9;
        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, true, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);

        activityLevel = "medium";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        assertEquals(299, Math.round(ral.getMetabolicRate()));
        // Expected color: green
        assertEquals(COLOR_GREEN, ral.getRecommendationColor(wbgt.getWBGT(), ral.calculateRALValue()));
        // Expected WBGT value
        assertEquals(12.8343, wbgt.getWBGT(), 0.0001);
        // Expected RAL value
        assertEquals(24.9836, ral.calculateRALValue(), 0.0001);
    }

    @Test
    public void testWBGTCustom() {
        calendar.set(year, 10 - 1, 24, 15, 15);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1
                , false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, 10, 24, 15, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), 1014, 9, 40, 7.2, zspeed, dT, urban);

        activityLevel = "medium";
        RecommendedAlertLimitISO7243 ral = new RecommendedAlertLimitISO7243(activityLevel, height, weight);

        // Check that value 415, which is the corresponding metabolic rate, returns
        // a reference limit of 26 when user is acclimatized
        assertEquals(299, Math.round(ral.getMetabolicRate()));
        // Expected color: green
        assertEquals(COLOR_GREEN, ral.getRecommendationColor(wbgt.getWBGT(), ral.calculateRALValue()));
        // Expected WBGT value
        assertEquals(7.7400, wbgt.getWBGT(), 0.0001);
        // Expected RAL value
        assertEquals(24.9836, ral.calculateRALValue(), 0.0001);
    }
}
