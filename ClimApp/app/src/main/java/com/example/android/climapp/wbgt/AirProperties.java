package com.example.android.climapp.wbgt;

public class AirProperties {

    final double Cp = 1003.5; 		// Varmekapacitet luft (J/(kg K))
    final double M_AIR = 28.97; 		// Molmasse luft (g/mol)
    final double M_H2O = 18.015; 		// Molmasse vand (g/mol)
    final double RATIO = ( Cp*M_AIR/M_H2O ); 	// Mellemregning
    final double R_GAS = 8314.34; 			// Universel gaskonstant (J/(mol K))
    final double  R_AIR = ( R_GAS/M_AIR ); 	// Specific gaskontant luft
    final double Pr = ( Cp / ( Cp + 1.25*R_AIR ) );  // Prandtls tal luft n.d.??

    public int count = 0;

    public AirProperties() {  }

    /** ============================================================================
     * Purpose: calculate the saturation vapor pressure (mb) over liquid water
     * (phase = 0) or ice (phase = 1).
     *
     * Reference: Buck's (1981) approximation (eqn 3) of Wexler's (1976) formulae.
     */
    public double esat(double tk, int phase) {
        double y, es;

        if (phase == 0) { /* over liquid water */
            y = (tk - 273.15)/(tk - 32.18);
            es = 6.1121 * Math.exp( 17.502 * y );
			/* es = (1.0007 + (3.46E-6 * pres)) * es /* correction for moist air, if pressure is available */
        } else { /* over ice */
            y = (tk - 273.15)/(tk - 0.6);
            es = 6.1115 * Math.exp( 22.452 * y );
			/* es = (1.0003 + (4.18E-6 * pres)) * es /* correction for moist air, if pressure is available */
        }

        es = 1.004 * es; /* correction for moist air, if pressure is not available; for pressure > 800 mb */
		/* es = 1.0034 * es; /* correction for moist air, if pressure is not available; for pressure down to 200 mb */
        return ( es );
    }

	/** ============================================================================
	 * Purpose: calculate the dew point (phase=0) or frost point (phase=1)
	 * temperature, K.
	 */
    public double dew_point(double e, int phase) {
        double z, tdk;

        if ( phase == 0 ) { /* dew point */
            z = Math.log( e / (6.1121*1.004) );
            tdk = 273.15 + 240.97*z/(17.502-z);
        } else { /* frost point */
            z = Math.log( e / (6.1115*1.004) );
            tdk = 273.15 + 272.55*z/(22.452-z);
        }
        return(tdk);
    }

	/* ============================================================================
	 * Purpose: calculate the viscosity of air, kg/(m s)
	 *
	 * Reference: BSL, page 23.
	 */

    public double viscosity(double Tair) {
        double sigma = 3.617,
                eps_kappa = 97.0;
        double Tr, omega;

        Tr = Tair / eps_kappa;
        omega = ( Tr - 2.9 ) / 0.4 * ( -0.034 ) + 1.048;

        return( 2.6693E-6 * Math.sqrt( M_AIR*Tair ) / ( sigma * sigma * omega ) );
    }

	/* ============================================================================
	 * Purpose: calculate the thermal conductivity of air, W/(m K)
	 *
	 * Reference: BSL, page 257.
	 */

    public double thermal_cond(double Tair) {
        print("Tair i thermal_cond", Tair, false);
        print("Thermal conductivity air i Thermal_cond", ( Cp + 1.25 * R_AIR ) * viscosity(Tair), false);

        return(( Cp + 1.25 * R_AIR ) * viscosity(Tair));
    }

	/* ============================================================================
	 * Purpose: calculate the diffusivity of water vapor in air, m2/s
	 *
	 * Reference: BSL, page 505.
	 */

    public double diffusivity(double Tair, double Pair) {

        double Pcrit_air = 36.4,
                Pcrit_h2o = 218.,
                Tcrit_air = 132.,
                Tcrit_h2o = 647.3,
                a = 3.640E-4,
                b = 2.334;

        double Patm, Pcrit13, Tcrit512, Tcrit12, Mmix;

        Pcrit13 = Math.pow( ( Pcrit_air * Pcrit_h2o ),(1./3.) );
        Tcrit512 = Math.pow( ( Tcrit_air * Tcrit_h2o ),(5./12.) );
        Tcrit12 = Math.sqrt( Tcrit_air * Tcrit_h2o );
        Mmix = Math.sqrt( 1./M_AIR + 1./M_H2O );
        Patm = Pair / 1013.25 ; /* convert pressure from mb to atmospheres */

        return( a * Math.pow( (Tair/Tcrit12),b) * Pcrit13 * Tcrit512 * Mmix / Patm * 1E-4 );
    }

	/* ============================================================================
	 * Purpose: calculate the heat of evaporation, J/kg, for temperature
	 * in the range 283-313 K.
	 *
	 * Reference: Van Wylen and Sonntag, Table A.1.1
	 */

    public double evap(double Tair) {
		/*		float Tair; /* air temperature, K */
        print("Temp i evap: ", Tair, false);
        print("evap: ", (313.15 - Tair)/30. * (-71100.) + 2.4073E6, false);

        return( (313.15 - Tair)/30. * (-71100.) + 2.4073E6 );
    }

	/* ============================================================================
	 * Purpose: calculate the atmospheric emissivity.
	 *
	 * Reference: Oke (2nd edition), page 373. Boundary Layer Climates 2nd Edition by T. R. Oke */
    public double emis_atm(double Tair, double rh) {
        double e = rh * esat(Tair, 0);
        print("vap pres.", e, false);
        print("emis_atm.", 0.575*Math.pow(e, 0.143), false);

        return( 0.575 * Math.pow(e, 0.143) );
    }

    public double density(double Tair, double Pair) {
        return( Pair * 100. / ( R_AIR * (Tair) ) );
    }

    public void print(String name, double parm, boolean show) {
        if (show) {
            count++;
            System.out.println(count + " " + name + ": " + parm);
        }
    }
}