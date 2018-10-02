package com.example.android.climapp;

import com.android.climapp.wbgt.Solar;
import com.android.climapp.wbgt.SolarRad;
import com.android.climapp.wbgt.WBGT;

import org.junit.Test;

import java.util.Calendar;
import java.util.GregorianCalendar;

import static junit.framework.Assert.assertEquals;

/**
 * Created by frksteenhoff on 14-04-2018.
 * Used for testing the correctness of the WBGT calculations
 */

public class WBGTTest {
    //Date and time for calculation
    private GregorianCalendar cal = (GregorianCalendar) GregorianCalendar.getInstance();

    private Calendar calendar = Calendar.getInstance();
    private int utcOffset = (calendar.get(Calendar.ZONE_OFFSET) + calendar.get(Calendar.DST_OFFSET)) / (60 * 60000); // Total offset (geographical and daylight savings) from UTC in hours

    // All basic fields
    private int year = 2018;
    private int month = 6;
    private int day = 11;
    private int hour = 12; //Local time
    private int min = 0;

    private  int avg = 10;
    //        double solar = 200; //Solindstråling - only used when solar cannot be calculated
    private double pres = 1013; // barometric pressure, mb
    private double Tair = 25;
    private double relhum = 50; /* relative humidity, % */
    private double speed = 2; //Wind speed (m/s) measured in height zspeed m
    private double zspeed = 2;
    private double dT = 0; //Vertical temp difference

    private int urban = 0;

    @Test
    public void testInitalValuesGhana() {
        //Location Accra, Ghana
        double latitude = 5.593222;
        double longitude = -0.140138;

        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);
        assertEquals(26.7, wbgt.getWBGTWithoutSolar());
        assertEquals(25.0, wbgt.getWBGTWithSolar());
    }

    @Test
    public void testInitalValuesNumberFormatException() {
        //Location Accra, Ghana
        String latitude = "5.593222";
        String longitude = "-0.140138";

        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(Double.parseDouble(longitude), Double.parseDouble(latitude), calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, Double.parseDouble(latitude), Double.parseDouble(longitude), sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);
        assertEquals(26.7, wbgt.getWBGTWithoutSolar());
        assertEquals(25.0, wbgt.getWBGTWithSolar());
    }

    @Test
    public void testInitalValuesGreenland() {
        //Location Discobugten, Grønland
        double latitude = 70.8;
        double longitude = 50;

        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);
        assertEquals(25.9, wbgt.getWBGTWithoutSolar());
        assertEquals(24.4, wbgt.getWBGTWithSolar());
    }


    @Test
    public void testInitalValuesCopenhagen() {
        //Location Copenhagen
        double latitude = 55.67594;
        double longitude = 12.56553;

        calendar.set(year, month - 1, day, hour, min);

        Solar s = new Solar(longitude, latitude, calendar, utcOffset);
        SolarRad sr = new SolarRad(s.zenith(), calendar.get(Calendar.DAY_OF_YEAR), 0, 1, false, false); //(solar zenith angle, day no, cloud fraction, cloud type, fog, precipitation)

        // Making all calculations
        WBGT wbgt = new WBGT(year, month, day, hour, min, utcOffset, avg, latitude, longitude, sr.solarIrradiation(), pres, Tair, relhum, speed, zspeed, dT, urban);
        assertEquals(26.6, wbgt.getWBGTWithoutSolar());
        assertEquals(25.0, wbgt.getWBGTWithSolar());
    }

    @Test
    public void proveCalendar() {
        // On leap years, setting too high a value for a month is handled
        // Here we have the second day of march, as last day in Feb is the 28th
        calendar.set(1992, 1, 31, hour, min);
        assertEquals(2, calendar.get(Calendar.DAY_OF_MONTH));

        // Months are zero-indexed therefore March = 2
        assertEquals(2, calendar.get(Calendar.MONTH));

        // Check that the February 31st = 2nd of March in 1992 = 31 + 28 + 3
        // Because of leap year
        assertEquals(62, calendar.get(Calendar.DAY_OF_YEAR));

        // Using Gregorian Calendar removes need of daynum method
        assertEquals(true, cal.isLeapYear(1992));
    }
}
