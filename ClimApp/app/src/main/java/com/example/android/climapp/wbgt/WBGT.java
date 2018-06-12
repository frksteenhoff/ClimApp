package com.example.android.climapp.wbgt;

import java.util.Calendar;

/* ============================================================================
 * Purpose: to calculate the outdoor wet bulb-globe temperature, which is
 * the weighted sum of the air temperature (dry bulb), the globe temperature,
 * and the natural wet bulb temperature: WBGT = 0.1 * Tair + 0.7 * Tnwb + 0.2 * Tg.
 * The program predicts Tnwb and Tg using meteorological input data then combines
 * the results to produce WBGT.
 *
 * Modified 2-Nov-2009: calc_wbgt returns -1 if either subroutines Tg or Tnwb return -9999,
 * which signals a failure to converge, probably due to a bad input value; otherwise, calc_wbgt
 * returns 0.
 *
 * If the 2-m wind speed is not available, it is estimated using a wind speed at another level.
 *
 * Reference: Liljegren, J. C., R. A. Carhart, P. Lawday, S. Tschopp, and R. Sharp:
 * Modeling the Wet Bulb Globe Temperature Using Standard Meteorological
 * Measurements. The Journal of Occupational and Environmental Hygiene,
 * vol. 5:10, pp. 645-655, 2008.
 *
 * Link til c-kode: https://github.com/mdljts/wbgt/blob/master/src/wbgt.c
 *
 * Author: James C. Liljegren
 * Decision and Information Sciences Division
 * Argonne National Laboratory
 *
 * Liljegreen et al's calculation of WBGT was corrected so that the globe temperature determined for a globe
 * of diameter 0.0508 m was converted to a Dglobe of 0.15 m as ISO 7243 is based on. Also, ISO 7243 lists reference
 * values for WBGT without solar radiation so a condition was introduced that calculates WBGT with or ithour solar radiation
 * depending on the value of solar (greater than or equal to 0.
 * JTOF
 *
 * Changes to the code structure made by Henriette Steenhoff
 * - commented out unused variables
 * - commented out method numofday to instead make use of java.util.Calendar
 * - added brackets where missing (mostly in if statements)
 * - simplified logic, made use of ternary operators
 * - removed all print statements
 * - made WBGT method return instead of printing
 */

public class WBGT {
    /*
     * define mathematical constants
     */
    private final double DEG_RAD = 0.017453292519943295;
    private final double RAD_DEG = 57.295779513082323;

    /*
     * define physical constants
     */
    private final int SOLAR_CONST = 1367; //Solkonstant ydre atmosfære (W/m2)
    private final double GRAVITY = 9.807; //tyngdeacceleration (m/s2)
    private final double STEFANB = 5.6696E-8; //Stefan-Boltzmanns konstant (W/(m2 K4))

    /*
     * define wick constants
     */
    private final double EMIS_WICK = 0.95;
    private final double ALB_WICK = 0.4;
    private final double D_WICK = 0.007;
    private final double L_WICK = 0.0254;

    /*
     * define globe constants
     */
    private final double EMIS_GLOBE = 0.95;
    private final double ALB_GLOBE = 0.05;
    private final double D_GLOBE = 0.0508; /* ((Liljegreen et al. bruger en globe med en diameter på 0.0508m. WBGT gælder for en globe på 150 mm. Metode Tg150 omregner Tglobe fra 50.8mm to 150mm */

    /*
     * define surface constants
     */
    private final double EMIS_SFC = 0.999;
    private final double ALB_SFC = 0.45;

    /*
     * define computational and physical limits
     */
    private final double CZA_MIN = 0.00873;
    private final double NORMSOLAR_MAX = 0.85;
    private final double REF_HEIGHT = 2.0; //Reference height for air velocity measurement
    private final double MIN_SPEED = 0.13;
    private final double CONVERGENCE = 0.02;
    private final double MAX_ITER = 50;

    private final double TWOPI = 6.2831853071795864;

    private int year,   /* 4-digit, e.g. 2007 */
            month,   /* month (1-12) or month = 0 implies iday is day of year */
            day,     /* day of month or day of year (1-366) */
            hour,    /* hour in local standard time (LST) */
            minute,  /* minutes past the hour */
            utcOffset, /* LST-GMT difference, hours (negative in USA) */
            avg,     /* averaging time of meteorological inputs, minutes */
            elev,    /* Elevation at location - nej, det er solhøjde = solar altitude*/
            urban,   /* select "urban" (1) or "rural" (0) wind speed power law exponent*/
            stabilityClass, /* stability class used to calculate wind speed if zspeed != 2m */
            count = 0;

    private double lat, /* north latitude, decimal */
            lon,     /* east longitude, decimal (negative in USA) */
            solar,   /* solar irradiance, W/m2 */
            pres,    /* barometric pressure, mb */
            Tair,    /* air (dry bulb) temperature, degC */
            Pair,    /* atmospheric pressure, mb (around 1013.25 mb at sea level) */
            relhum,  /* relative humidity, % */
            speed,   /* wind speed, m/s */
            zspeed,  /* height of wind speed measurement, m */
            dT,      /* vertical temperature difference (upper minus lower), degC */
            est_speed, /* estimated speed at reference height, m/s. */
            Tg,      /* globe temperature, degC */
            Tnwb,    /* natural wet bulb temperature, degC */
            Tpsy,    /* psychrometric wet bulb temperature, degC */
            WBGT,    /* wet bulb globe temperature, degC */
            WBGT_w_solar,    /* HSTE: wet bulb globe temperature, degC with solar */
            WBGT_wo_solar,    /* HSTE: wet bulb globe temperature, degC without solar */
            altitude,/* Solar altitude angle, deg */
            cza,     /* cosine of solar zenith angle */
            fdir,    /* fraction of solar irradiance due to direct beam */
            tk,      /* temperature converted to kelvin */
            soldist, /* distance between Earth and sun */
            rh,      /* relative humidity, fraction between 0 and 1 */
            hour_gmt,/* hour at GMT (=UTC) */
            Tg150,   /* Globe temperature converted to a blobe of 150 mm according to eq. c.4 in ISO 7243 */
            dday;

    private boolean daytime;

    AirProperties ap = new AirProperties();

    public WBGT(int year, int month, int day, int hour, int minute, int utcOffset, int avg, double lat, double lon, double solar, double pres, double Tair, double relhum, double speed, double zspeed, double dT, int urban) {

        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.utcOffset = utcOffset;
        this.avg = avg;
        this.urban = urban;

        this.lat = lat;
        this.lon = lon;
        this.solar = solar;
        this.pres = pres;
        this.Pair = pres;
        this.Tair = Tair;
        this.relhum = relhum;
        this.speed = speed;
        this.zspeed = zspeed; //Referencehøjde er 2 m (=REF_HEIGHT)
        this.dT = dT; //Lodret temperaturdifferens. Kan godt være 0

		/*
		 * convert time to GMT and center in avg period;
		 */
        hour_gmt = hour - utcOffset + ( minute - 0.5 * avg ) / 60.;
        dday = day + hour_gmt / 24.;

        print("hour_gmt", hour_gmt, false);
        print("dday", dday, false);

		/*
		 * unit conversions
		 */
        tk = Tair + 273.15; /* degC to kelvin */
        rh = 0.01 * relhum; /* % to fraction */

        print("tk: ", tk, false);
        print("rh", rh, false);

		/*
		 * calculate the cosine of the solar zenith angle and fraction of solar irradiance
		 * due to the direct beam; adjust the solar irradiance if it is out of bounds
		 */
        calcSolarParameters(year, month, dday, lat, lon, solar);

		/*
		 * estimate the wind speed, if necessary
		 */
        if (zspeed != REF_HEIGHT) {
            daytime = (cza > 0.);
            System.out.println("daytime: " + daytime);

            stabilityClass = stabSrdt(daytime, speed, solar, dT);
            print("stabilityClass", stabilityClass, false);

            est_speed = est_wind_speed(speed, zspeed, stabilityClass, urban);
            print("est_speed", est_speed, false);

        } else { est_speed = speed; }

		/*
		 * calculate the globe, natural wet bulb, psychrometric wet bulb, and
		 * outdoor wet bulb globe temperatures
		 */
        Tg = calculateGlobeTemp(tk, rh, pres, est_speed, solar, fdir, cza);
        print("Tg", Tg, false);

        Tg150 = Tg150(D_GLOBE, Tg, Tair, est_speed);
        print("Tg150: ", Math.round(10*Tg150)/10.0, false);

        Tnwb = calculateWetBulbTemp(tk, rh, pres, est_speed, solar, fdir, cza, 1);
        print("Tnwb", Math.round(10*Tnwb)/10.0, false);

        Tpsy = calculateWetBulbTemp(tk, rh, pres, est_speed, solar, fdir, cza, 0);
        print("Tpsy", Tpsy, false);

        WBGT = (solar > 0) ? (0.1 * Tair + 0.2 * Tg150 + 0.7 * Tnwb) : (WBGT = 0.3 * Tg150 + 0.7 * Tnwb);

        print("Tair", Tair, false);
        WBGT_w_solar = Math.round(10*(0.1 * Tair + 0.2 * Tg150 + 0.7 * Tnwb))/10.0;
        WBGT_wo_solar = Math.round(10*(0.3 * Tg150 + 0.7 * Tnwb))/10.0;
    }

    /**
     * Get TWBG without solar
     * @return TWBG value without solar
     */
    public double getWBGTWithoutSolar() {
        return WBGT_wo_solar;
    }

    /**
     * Get TWBG with solar
     * @return TWBG value with solar
     */
    public double getWBGTWithSolar() {
        return WBGT_w_solar;
    }

    /*
     * Metode getWBGT() tilføjet i java fordi kontruktør ikke returnerer argumenter.
     * Checker først om alle beregninger gået godt og returnerer så WBGT, som enten er -9999 eller en værdi
     */
    public double getWBGT() {
        checkWBGT();
        return WBGT;
    }

    /*
     * Metode checkWBGT() tilføjet i java fordi kontruktør ikke returnerer argumenter.
     * Checker om alle beregninger gået godt (0) eller noget er gået galt (1)
     */
    private int checkWBGT() {

        if ( Tg == -9999 || Tnwb == -9999 ) {
            WBGT = -9999;
            return -1;
        } else
            return 0;
    }

	/* ============================================================================
	 * Purpose: to calculate the cosine solar zenith angle and the fraction of the
	 * solar irradiance due to the direct beam.
	 *
	 * Author: James C. Liljegren
	 * Decision and Information Sciences Division
	 * Argonne National Laboratory
	 */

    private void calcSolarParameters(int year, int month, double day, double lat, double lon, double solar) {

        double toasolar, normsolar;
        double days_1900 = 0.0 /*, ap_ra, ap_dec, refr, azim*/;

        solarposition(year, month, day, days_1900, lat, lon);

        cza = Math.cos( (90.- altitude)*DEG_RAD );

        print("solar zenith angle (radians)", Math.acos(cza), false);
        print("solar zenith angle (deg)", Math.toDegrees(Math.acos(cza)), false);

        toasolar = SOLAR_CONST * Math.max(0., cza) / (soldist*soldist);
        print("max: " , Math.max(0., cza), false);
        print("soldist", soldist, false);
        print("toasolar", toasolar, false);

		/*
		 * if the sun is not fully above the horizon
		 * set the maximum (top of atmosphere) solar = 0
		 */
        if (cza < CZA_MIN) toasolar = 0.;

        if (toasolar > 0.) {
			/*
			 * account for any solar sensor calibration errors and
			 * make the solar irradiance consistent with normsolar
			 */
            normsolar = Math.min( solar / toasolar, NORMSOLAR_MAX );
            solar = normsolar * toasolar;
            print("solar", solar, false);

			/*
			 * calculate the fraction of the solar irradiance due to the direct beam
			 */
            if (normsolar > 0.) {
                fdir = Math.exp( 3. - 1.34 * normsolar - 1.65 / normsolar );
                fdir = Math.max(Math.min(fdir, 0.9), 0.0);
            } else
                fdir = 0.;
        } else {
            fdir = 0.;
        }
        print("fdir", fdir, false);
    }

	/* ============================================================================
	 * Purpose: to calculate the natural wet bulb temperature.
	 *
	 * Author: James C. Liljegren
	 * Decision and Information Sciences Division
	 * Argonne National Laboratory
	 */

    private double calculateWetBulbTemp(double Tair, double rh, double Pair, double speed, double solar, double fdir, double cza, int rad) {

		/*	rad; switch to enable/disable radiative heating; Værdi 1 (med) eller 0 (uden)
		/* no radiative heating --> pyschrometric wet bulb temp */

        double a = 0.56; /* from Bedingfield and Drew */
        double sza, Tsfc, Tdew, Tref, Twb_prev, Twb_new, eair, ewick, /*density,*/
                Sc,   /* Schmidt number */
                h,    /* convective heat transfer coefficient */
                Fatm; /* radiative heating term */

        Tsfc = Tair; 				//Tsfc er surface temperatur. Lig Tair da EMIS_SURFACE = 0.999 og EMIS_Surface * Tsfc^4 = Tair^4
        sza = Math.acos(cza); 		// solar zenith angle, radians
        eair = rh * ap.esat(Tair, 0);
        Tdew = ap.dew_point(eair, 0); //Tdew i Kelvin
        print("Tdew: ", Tdew, false);
        Twb_prev = Tdew; 			// first guess is the dew point temperature

        boolean converged = false;
        int iter = 0;

        do {
            iter++;
            print("Twb_prev: ", Twb_prev, false);
            print("Tair: ", Tair, false);

            Tref = 0.5*( Twb_prev + Tair ); /* evaluate properties at the average temperature */
            h = h_cylinder_in_air(D_WICK, L_WICK, Tref, Pair, speed);
            Fatm = STEFANB * EMIS_WICK *
                    ( 0.5*( ap.emis_atm(Tair, rh)*Math.pow(Tair, 4.) + EMIS_SFC*Math.pow(Tsfc, 4.) ) - Math.pow(Twb_prev, 4.) )
                    + (1.-ALB_WICK) * solar *
                    ( (1.-fdir)*(1.+0.25*D_WICK/L_WICK) + fdir*((Math.tan(sza)/Math.PI)+0.25*D_WICK/L_WICK) + ALB_SFC );

            print("Fatm: ", Fatm, false);
            print("density i Twb: ", ap.density(Tref, Pair), false);
            print("Tref: ", Tref, false);

            ewick = ap.esat(Twb_prev,0);
            Sc = ap.viscosity(Tref)/(ap.density(Tref, Pair)*ap.diffusivity(Tref, Pair));
            print("Diffusivity: ", ap.diffusivity(Tref, Pair), false);

            Twb_new = Tair - ap.evap(Tref)/ap.RATIO * (ewick-eair)/(Pair-ewick) * Math.pow(ap.Pr/Sc,a) + (Fatm/h * rad);

            if ( Math.abs(Twb_new-Twb_prev) < CONVERGENCE ) converged = true;

            Twb_prev = 0.9*Twb_prev + 0.1*Twb_new;

        } while (!converged && iter < MAX_ITER);

        //     System.out.println("converged Twb: " + converged);
        print("Twb: ", (Twb_new - 273.15), false);

        return converged ? Twb_new - 273.15 : -9999.;
    }

	/* ============================================================================
	 * Purpose: to calculate the convective heat transfer coefficient in W/(m2 K)
	 * for a long cylinder in cross flow.
	 *
	 * Reference: Bedingfield and Drew, eqn 32
	 *
	 */

    private double h_cylinder_in_air(double diameter, double length, double Tair, double Pair, double speed) {
        double a = 0.56, /* parameters from Bedingfield and Drew */
                b = 0.281,
                c = 0.4;

        double Re, /* Reynolds number */
                Nu; /* Nusselt number */

        print("Pair", Pair, false);
        print("Rair", ap.R_AIR, false);
        print("Tair", Tair, false);
        print("Density i h_cyl", ap.density(Tair, Pair), false);
        print("Viscosity i h_cyl", ap.viscosity(Tair), false);

        Re = Math.max(speed, MIN_SPEED) * ap.density(Tair, Pair) * diameter / ap.viscosity(Tair);

        print("Re", Re, false);

        Nu = b * Math.pow(Re,(1.-c)) * Math.pow(ap.Pr,(1.-a));

        print("Nu", Nu, false);
        print("thermal_cond", ap.thermal_cond(Tair), false);

        return( Nu * ap.thermal_cond(Tair) / diameter );
    }

	/* ============================================================================
	 * Purpose: to calculate the globe temperature.
	 *
	 * Author: James C. Liljegren
	 * Decision and Information Sciences Division
	 * Argonne National Laboratory
	 */

    private double calculateGlobeTemp(double Tair, double rh, double Pair, double speed, double solar, double fdir, double cza) {
        //	public double Tglobe() {
        double Tsfc, Tref, Tglobe_prev, Tglobe_new, h;
        boolean converged = false;
        int iter = 0;

        Tsfc = Tair; //Tsfc er temperature of surface
        print("Tsfc: ", Tsfc, false);
        print("Tair: ", Tair, false);

        Tglobe_prev = Tair; /* first guess is the air temperature */
        print("Tglobe_prev: ", Tglobe_prev, false);

        print("D_GLOBE", D_GLOBE, false);
        print("Pair", Pair, false);
        print("speed", speed, false);

        do {
            iter++;
            Tref = 0.5*( Tglobe_prev + Tair ); /* evaluate properties at the average temperature */
            print("Tref", Tref, false);
            print("Tglobe_prev", Tglobe_prev, false);

            h = h_sphere_in_air(D_GLOBE, Tref, Pair, speed);
            print("h", h, false);

            Tglobe_new = Math.pow( 0.5*( ap.emis_atm((Tair), rh)*Math.pow((Tair),4.) + EMIS_SFC*Math.pow((Tsfc), 4.) )
                    - h/(STEFANB*EMIS_GLOBE)*(Tglobe_prev - Tair)
                    + solar/(2.*STEFANB*EMIS_GLOBE)*(1.-ALB_GLOBE)*(fdir*(1./(2.*cza)-1.)+1.+ ALB_SFC) , 0.25);

            print("Tglobe_new", Tglobe_new, false);

            if ( Math.abs( Tglobe_new - Tglobe_prev) < CONVERGENCE ) converged = true;

            Tglobe_prev = 0.9*Tglobe_prev + 0.1*(Tglobe_new);

        } while (!converged && iter < MAX_ITER);

        //     System.out.println("converged: " + converged);
        print("Tglobe_new final", (Tglobe_new), false);

        return (converged) ? (Tglobe_new - 273.15) : (-9999.);
    }

    /* ============================================================================
     * Purpose: to calculate the convective heat transfer coefficient, W/(m2 K)
     * for flow around a sphere.
     *
     * Reference: Bird, Stewart, and Lightfoot (BSL), page 409.
     *
     */
    private double h_sphere_in_air(double diameter, double Tair, double Pair, double speed) {
        double Re, 	/* Reynolds number */
                Nu; 		/* Nusselt number */
        Re = Math.max(speed, MIN_SPEED) * ap.density(Tair, Pair) * diameter / ap.viscosity(Tair);

        print("max(speed, min_speed)", Math.max(speed, MIN_SPEED), false);
        print("diameter", diameter, false);
        print("Re", Math.max(speed, MIN_SPEED) * ap.density(Tair, Pair) * diameter / ap.viscosity(Tair), false);
        print("Prandtl", ap.Pr, false);

        Nu = 2.0 + 0.6 * Math.sqrt(Re) * Math.pow(ap.Pr, 0.3333);

        print("Nu", Nu, false);
        print("h", Nu * ap.thermal_cond(Tair) / diameter , false);

        return( Nu * ap.thermal_cond(Tair) / diameter );
    }

	/* ============================================================================
	 * Version 3.0 - February 20, 1992.
	 *
	 * solarposition() employs the low precision formulas for the Sun's coordinates
	 * given in the "Astronomical Almanac" of 1990 to compute the Sun's apparent
	 * right ascension, apparent declination, altitude, atmospheric refraction
	 * correction applicable to the altitude, azimuth, and distance from Earth.
	 * The "Astronomical Almanac" (A. A.) states a precision of 0.01 degree for the
	 * apparent coordinates between the years 1950 and 2050, and an accuracy of
	 * 0.1 arc minute for refraction at altitudes of at least 15 degrees.
	 *
	 * The following assumptions and simplifications are made:
	 * -> refraction is calculated for standard atmosphere pressure and temperature
	 * at sea level.
	 * -> diurnal parallax is ignored, resulting in 0 to 9 arc seconds error in
	 * apparent position.
	 * -> diurnal aberration is also ignored, resulting in 0 to 0.02 second error
	 * in right ascension and 0 to 0.3 arc second error in declination.
	 * -> geodetic site coordinates are used, without correction for polar motion
	 * (maximum amplitude of 0.3 arc second) and local gravity anomalies.
	 * -> local mean sidereal time is substituted for local apparent sidereal time
	 * in computing the local hour angle of the Sun, resulting in an error of
	 * about 0 to 1 second of time as determined explicitly by the equation of
	 * the equinoxes.
	 *
	 * Right ascension is measured in hours from 0 to 24, and declination in
	 * degrees from 90 to -90.
	 * Altitude is measured from 0 degrees at the horizon to 90 at the zenith or
	 * -90 at the nadir. Azimuth is measured from 0 to 360 degrees starting at
	 * north and increasing toward the east at 90.
	 * The refraction correction should be added to the altitude if Earth's
	 * atmosphere is to be accounted for.
	 * Solar distance from Earth is in astronomical units, 1 a.u. representing the
	 * mean value.
	 *
	 * The necessary input parameters are:
	 * -> the date, specified in one of three ways:
	 * 1) year, month, day.fraction
	 * 2) year, daynumber.fraction
	 * 3) days.fraction elapsed since January 0, 1900.
	 * -> site geodetic (geographic) latitude and longitude.
	 *
	 * Refer to the function declaration for the parameter type specifications and
	 * formats.
	 *
	 * solarposition() returns -1 if an input parameter is out of bounds, or 0 if
	 * values were written to the locations specified by the output parameters.
	 */
	/* Author: Nels Larson
	 * Pacific Northwest National Laboratory
	 * P.O. Box 999
	 * Richland, WA 99352
	 * U.S.A.
	 */

    private int solarposition(int year, int month, double day, double days_1900, double latitude, double longitude) {
        Calendar calobj = Calendar.getInstance();
        calobj.set(year, month, (int) day);

        double ap_ra,     /* Apparent solar right ascension.
		 * [hours; 0.0 <= *ap_ra < 24.0] */
                ap_dec,    /* Apparent solar declination.
		 * [degrees; -90.0 <= *ap_dec <= 90.0] */
		/*		altitude,  /* JT changed to Instance variable. Solar altitude, uncorrected for refraction.
		 * [degrees; -90.0 <= *altitude <= 90.0] */
                refraction,/* Refraction correction for solar altitude.
		 * Add this to altitude to compensate for refraction.
		 * [degrees; 0.0 <= *refraction] */
                azimuth,   /* Solar azimuth.
		 * [degrees; 0.0 <= *azimuth < 360.0, East is 90.0] */
                distance;  /* Distance of Sun from Earth (heliocentric-geocentric).
		 * [astronomical units; 1 a.u. is mean distance] */

        int daynumber, /* Sequential daynumber during a year. */
                delta_days, /* Whole days since 2000 January 0. */
                delta_years; /* Whole years since 2000. */

        double cent_J2000, /* Julian centuries since epoch J2000.0 at 0h UT. */
                cos_alt, /* Cosine of the altitude of Sun. */
                cos_apdec, /* Cosine of the apparent declination of Sun. */
                cos_az, /* Cosine of the azimuth of Sun. */
                cos_lat, /* Cosine of the site latitude. */
                cos_lha, /* Cosine of the local apparent hour angle of Sun. */
                days_J2000, /* Days since epoch J2000.0. */
                ecliptic_long, /* Solar ecliptic longitude. */
                lmst, /* Local mean sidereal time. */
                local_ha, /* Local mean hour angle of Sun. */
                gmst0h, /* Greenwich mean sidereal time at 0 hours UT. */
                integral, /* Integral portion of double precision number. */
                mean_anomaly, /* Earth mean anomaly. */
                mean_longitude, /* Solar mean longitude. */
                mean_obliquity, /* Mean obliquity of the ecliptic. */
                pressure = 1013.25, /* Earth mean atmospheric pressure at sea level. Millibars */
                sin_apdec, /* Sine of the apparent declination of Sun. */
                sin_az, /* Sine of the azimuth of Sun. */
                sin_lat, /* Sine of the site latitude. */
                tan_alt, /* Tangent of the altitude of Sun. */
                temp = 15.0, /* Earth mean atmospheric temperature at sea level. Celsius */
                ut; /* UT hours since midnight. */

		/* Check latitude and longitude for proper range before calculating dates.
		 */
        if (latitude < -90.0 || latitude > 90.0 || longitude < -180.0 || longitude > 180.0) {
            return -1;
        }
		/* If year is not zero then assume date is specified by year, month, day.
		/* If year is zero then assume date is specified by days_1900. */

        if (year != 0) { /* Date given by {year, month, day} or {year, 0, daynumber}. */

            if (year < 1950 || year > 2049) {
                return (-1);
            }
            if (month != 0) {
                if (month < 1 || month > 12 || day < 0.0 || day > 33.0) {
                    return (-1);
                }
                daynumber = calobj.get(Calendar.DAY_OF_YEAR);

            } else  {
                if (day < 0.0 || day > 368.0) {
                    return (-1);
                }
                daynumber = (int)day;
            }

            print("daynumber", daynumber, false);
			/* Construct Julian centuries since J2000 at 0 hours UT of date,
			 * days.fraction since J2000, and UT hours.
			 */
            delta_years = year - 2000;

			/* delta_days is days from 2000/01/00 (1900's are negative). */

            delta_days = delta_years * 365 + delta_years / 4 + daynumber;

            if (year > 2000) {
                delta_days += 1;
            }

			/* J2000 is 2000/01/01.5 */
            days_J2000 = delta_days - 1.5;
            print("days_J2000", days_J2000, false);

            cent_J2000 = days_J2000 / 36525.0;
            print("cent_J2000", cent_J2000, false);

			/*			ut = modf(day, integral); modf returnerer heltalsdal af argument. Modf eksisterer ikke i java, derfor beregnes fraction i næste linje */
            ut = day - (long) day;
            days_J2000 += ut;
            ut *= 24.0;
            print("ut", ut, false);
        } else {

			/* Date given by days_1900. */
			/* days_1900 is 18262 for 1950/01/00, and 54788 for 2049/12/32.
			 * A. A. 1990, K2-K4. */

            if (days_1900 < 18262.0 || days_1900 > 54788.0) {
                return -1;
            }

			/* Construct days.fraction since J2000, UT hours, and
			 * Julian centuries since J2000 at 0 hours UT of date.
			 */

			/* days_1900 is 36524 for 2000/01/00. J2000 is 2000/01/01.5 */

            days_J2000 = days_1900 - 36525.5;

            //      ut = modf(days_1900, &integral) * 24.0;  KUN c har modf.

            integral = (long) days_1900;
            double fraction = days_1900 - integral;
            print("days_1900", days_1900, false);
            print("integral", integral, false);
            print("fraction", fraction, false);
            ut = fraction * 24;
            cent_J2000 = (integral - 36525.5) / 36525.0;
        }

		/* Compute solar position parameters.
		 * A. A. 1990, C24.
		 */
        mean_anomaly = (357.528 + 0.9856003 * days_J2000);
        mean_longitude = (280.460 + 0.9856474 * days_J2000);

		/* Put mean_anomaly and mean_longitude in the range 0 -> 2 pi. */

        //		mean_anomaly = modf(mean_anomaly / 360.0, integral) * TWOPI;
        mean_anomaly = ((mean_anomaly / 360.0) - (long) (mean_anomaly / 360.0)) * 2 * Math.PI;
        print("mean_anomaly", mean_anomaly, false);
        //		mean_longitude = modf(mean_longitude / 360.0, integral) * TWOPI;
        mean_longitude = ((mean_longitude / 360.0) - (long) (mean_longitude / 360.0)) * 2 * Math.PI;


        mean_obliquity = (23.439 - 4.0e-7 * days_J2000) * DEG_RAD;
        print("mean_obliquity", mean_obliquity, false);
        ecliptic_long = ((1.915 * Math.sin(mean_anomaly)) + (0.020 * Math.sin(2.0 * mean_anomaly))) * DEG_RAD + mean_longitude;
        print("ecliptic_long", ecliptic_long, false);
        distance = 1.00014 - 0.01671 * Math.cos(mean_anomaly) - 0.00014 * Math.cos(2.0 * mean_anomaly);
        print("distance", distance, false);
        soldist = distance;

		/* Tangent of ecliptic_long separated into sine and cosine parts for ap_ra. */
        ap_ra = Math.atan2(Math.cos(mean_obliquity) * Math.sin(ecliptic_long), Math.cos(ecliptic_long));
        print("ap_ra", ap_ra, false);

		/* Change range of ap_ra from -pi -> pi to 0 -> 2 pi. */
        if (ap_ra < 0.0) {
            ap_ra += 2 * Math.PI;
        }
        print("ap_ra (radians)", ap_ra, false);

		/* Put ap_ra in the range 0 -> 24 hours. */
        //		ap_ra = modf(ap_ra / TWOPI, &integral) * 24.0;
        ap_ra = ((ap_ra / (2*Math.PI)) - (long) (ap_ra / (2*Math.PI))) * 24.0;
        print("ap_ra (hours)", ap_ra, false);

        ap_dec = Math.asin(Math.sin(mean_obliquity) * Math.sin(ecliptic_long));
        print("ap_dec (rad): ", ap_dec, false);
        print("ap_dec (deg): ", Math.toDegrees(ap_dec), false);

		/* Calculate local mean sidereal time.
		 * A. A. 1990, B6-B7.
		 */
		/* Horner's method of polynomial exponent expansion used for gmst0h. */
        gmst0h = 24110.54841 + cent_J2000 * (8640184.812866 + cent_J2000 * (0.093104 - cent_J2000 * 6.2e-6));
        print("gmst0h (seconds)", gmst0h, false);

		/* Convert gmst0h from seconds to hours and put in the range 0 -> 24. */
		/* gmst0h = modf(gmst0h / 3600.0 / 24.0, &integral) * 24.0; */
        gmst0h = ((gmst0h / 3600.0 / 24.0) - (long) (gmst0h / 3600.0 / 24.0)) * 24;
        print("gmst0h (hours)", gmst0h, false);
        if (gmst0h < 0.0) {
            gmst0h += 24.0;
        }

		/* Ratio of lengths of mean solar day to mean sidereal day is 1.00273790934
		 * in 1990. Change in sidereal day length is < 0.001 second over a century.
		 * A. A. 1990, B6.
		 */
        lmst = gmst0h + (ut * 1.00273790934) + longitude / 15.0;

		/* Put lmst in the range 0 -> 24 hours. */
        //	lmst = modf(lmst / 24.0, &integral) * 24.0;
        lmst = ((lmst / 24.0) - (long) (lmst / 24.0)) * 24.0;
        if (lmst < 0.0) {
            lmst += 24.0;
        }
        print("local mean standard time", lmst, false);
		/* Calculate local hour angle, altitude, azimuth, and refraction correction.
		 * A. A. 1990, B61-B62.
		 */
        local_ha = lmst - ap_ra;
        print("local_ha", local_ha, false);

		/* Put hour angle in the range -12 to 12 hours. */
        if (local_ha < -12.0) {
            local_ha += 24.0;
        } else if (local_ha > 12.0) {
            local_ha -= 24.0;
        }

		/* Convert latitude and local_ha to radians. */
        latitude *= DEG_RAD;
        local_ha = local_ha / 24.0 * 2 * Math.PI;
        cos_apdec = Math.cos(ap_dec);
        sin_apdec = Math.sin(ap_dec);
        cos_lat = Math.cos(latitude);
        sin_lat = Math.sin(latitude);
        cos_lha = Math.cos(local_ha);
        altitude = Math.asin(sin_apdec * sin_lat + cos_apdec * cos_lha * cos_lat);
        cos_alt = Math.cos(altitude);

		/* Avoid tangent overflow at altitudes of +-90 degrees.
		 * 1.57079615 radians is equal to 89.99999 degrees.
		 */
        tan_alt = (Math.abs(altitude) < 1.57079615) ? Math.tan(altitude) : 6.0e6;

        cos_az = (sin_apdec * cos_lat - cos_apdec * cos_lha * sin_lat) / cos_alt;
        sin_az = -(cos_apdec * Math.sin(local_ha) / cos_alt);
        azimuth = Math.acos(cos_az);

		/* Change range of azimuth from 0 -> pi to 0 -> 2 pi. */
        if (Math.atan2(sin_az, cos_az) < 0.0) {
            azimuth = 2 * Math.PI - azimuth;
        }

		/* Convert ap_dec, altitude, and azimuth to degrees. */
        ap_dec *= RAD_DEG;
        altitude *= RAD_DEG;
        azimuth *= RAD_DEG;
        print("azimuth", azimuth, false);
        print("Solar altitude (deg)", Math.round(10*altitude)/10.0, false);

		/* Compute refraction correction to be added to altitude to obtain actual
		 * position.
		 * Refraction calculated for altitudes of -1 degree or more allows for a
		 * pressure of 1040 mb and temperature of -22 C. Lower pressure and higher
		 * temperature combinations yield less than 1 degree refraction.
		 * NOTE:
		 * The two equations listed in the A. A. have a crossover altitude of
		 * 19.225 degrees at standard temperature and pressure. This crossover point
		 * is used instead of 15 degrees altitude so that refraction is smooth over
		 * the entire range of altitudes. The maximum residual error introduced by
		 * this smoothing is 3.6 arc seconds at 15 degrees. Temperature or pressure
		 * other than standard will shift the crossover altitude and change the error.
		 */
        if (altitude < -1.0 || tan_alt == 6.0e6) {
            refraction = 0.0;
        } else {
            if (altitude < 19.225) {
                refraction = (0.1594 + (altitude) * (0.0196 + 0.00002 * (altitude))) * pressure;
                refraction /= (1.0 + (altitude) * (0.505 + 0.0845 * (altitude))) * (273.0 + temp);
            } else {
                refraction = 0.00452 * (pressure / (273.0 + temp)) / tan_alt;
            }
        }
		/*
		 * to match Michalsky's sunae program, the following line was inserted
		 * by JC Liljegren to add the refraction correction to the solar altitude
		 */
        altitude = altitude + refraction;
        print("refracton", refraction, false);
        print("altitude corected for refraction", altitude, false);
        print("Cosine solar zenith: ", sin_lat*Math.sin(ap_dec) + Math.cos(altitude)*Math.cos(ap_dec)*cos_lha, false);
        return 0;

    }

	/* ============================================================================
	 * 'daynum()' returns the sequential daynumber of a calendar date during a
	 * Gregorian calendar year (for years 1 onward).
	 * The integer arguments are the four-digit year, the month number, and
	 * the day of month number.
	 * (Jan. 1 = 01/01 = 001; Dec. 31 = 12/31 = 365 or 366.)
	 * A value of -1 is returned if the year is out of bounds.
	 */
	/* Author: Nels Larson
	 * Pacific Northwest Lab.
	 * P.O. Box 999
	 * Richland, WA 99352
	 * U.S.A.
	 */

    /*	public int daynum(int year, int month, int day) {
            int begmonth[] = {0,0,31,59,90,120,151,181,212,243,273,304,334};
            int dnum;
            boolean leapyr = false;

            // There is no year 0 in the Gregorian calendar and the leap year cycle
            // changes for earlier years.
            if (year < 1) {
                return (-1);
            }
            // Leap years are divisible by 4, except for centurial years not divisible
            // by 400.
            if (((year%4) == 0 && (year%100) != 0) || (year%400) == 0) {
                leapyr = true;
            }
            dnum = begmonth[month] + day;

            if (leapyr && (month > 2)) {
                dnum += 1;
            }
            return (dnum);
        }
    */
	/* ============================================================================
	 * Purpose: estimate 2-m wind speed for all stability conditions
	 *
	 * Reference: EPA-454/5-99-005, 2000, section 6.2.5
	 */
    private double est_wind_speed(double speed, double zspeed, int stabilityClass, int urban) {
        double urban_exp[] = {0.15, 0.15, 0.20, 0.25, 0.30, 0.30},
                rural_exp[] = {0.07, 0.07, 0.10, 0.15, 0.35, 0.55},
                exponent,
                est_speed;

        exponent =  (urban == 1) ? urban_exp[stabilityClass-1] : rural_exp[stabilityClass-1];
        est_speed = speed * Math.pow( REF_HEIGHT/zspeed, exponent);
        est_speed = Math.max(est_speed, MIN_SPEED);

        return est_speed;
    }

    /* ============================================================================
     * Purpose: estimate the stability class
     *
     * Reference: EPA-454/5-99-005, 2000, section 6.2.5
     */
    private int stabSrdt(boolean daytime, double speed, double solar, double dT) {
        int lsrdt[][] = {
                {1, 1, 2, 4, 0, 5, 6, 0},
                {1, 2, 3, 4, 0, 5, 6, 0},
                {2, 2, 3, 4, 0, 4, 4, 0},
                {3, 3, 4, 4, 0, 0, 0, 0},
                {3, 4, 4, 4, 0, 0, 0, 0},
                {0, 0, 0, 0, 0, 0, 0, 0}};

        int i,j;

        if (daytime) {
            if (solar >= 925.0) {
                j = 0;
            } else if (solar >= 675.0) {
                j = 1;
            } else if (solar >= 175.0) {
                j = 2;
            } else {
                j = 3;
            }

            if (speed >= 6.0) {
                i = 4;
            } else if (speed >= 5.0) {
                i = 3;
            } else if (speed >= 3.0) {
                i = 2;
            } else if ( speed >= 2.0 ) {
                i = 1;
            } else {
                i = 0;
            }
        }
        else {
            j = (dT >= 0.0) ? 6 : 5;

            if (speed >= 2.5) {
                i = 2;
            } else if (speed >= 2.0) {
                i = 1;
            } else {
                i = 0;
            }
        }
        return (lsrdt[i][j]);
    }

    private double Tg150(double diam, double Tg, double Tair, double speed) {
        return(Tg + (1 + 1.13*Math.pow(speed, 0.6)*Math.pow(diam*1000, -0.4)*(Tg - Tair)) /(1 + 2.41*Math.pow(speed, 0.6)));
    }

    private void print(String name, double parm, boolean show) {
        if (show) {
            count++;
            System.out.println(count + " " + name + ": " + parm);
        }
    }
}