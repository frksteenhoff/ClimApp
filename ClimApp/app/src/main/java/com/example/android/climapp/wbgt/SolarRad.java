package com.example.android.climapp.wbgt;

public class SolarRad {

    /******************************************************************************************/
	/* Model for calculation of solar radiation adopted from Shapiro 1982                     */
	/*                                                                                        */
	/* The bodel builds on information on nine basic states of clouds in three                */
	/* layers, three states in layer 1 (highest) two in layer 2 (middle) and four in layer 3  */
	/* closes to or at ground.                                                                */
	/*                                                                                        */
	/* Each layer has a basic state in which the layer clear. In addition, the botttom layer  */
	/* has a basic state with smoke and/or fog occurring with an otherwise clear layer 3.     */
	/* Added to these clear-layer basic states, there are five overcast-layer basic states:   */
	/*                                                                                        */
	/* - thin cirrus/cirrostratus in layer 1   (cloudType = 1)                                */
	/* - thick cirrus/cirrostratus in layer 1  (cloudType = 2)                                */
	/* - altostratus/altocumulus in layer 2    (cloudType = 3)                                */
	/* - cumulus/Cb (?) in layer 3             (cloudType = 4)                                */
	/* - stratocumulus/stratus in layer 3      (cloudType = 5)                                */
	/*                                                                                        */
	/* All equations and coefficients from:                                                   */
	/*                                                                                        */
	/* Shapiro, R. 1982: Solar radiative flux calculations from standard surface              */
	/* meteorological observations. Air Force Geophysics Laboratory Scientific Report no. 1,  */
	/* AFGL-TR-82-0039, 55 pp. [222.dtic.mil/dtic/tr/fulltext/u2/a118775.pdf                  */
	/*                                                                                        */
    /******************************************************************************************/


    /******************************************************************************************/
	/*                                                                                        */
	/* Notes to parameters in arrays:                                                         */
	/*                                                                                        */
	/* r3 (F/K) is used for the clear layer reflectivity of the bottom layer when fog and/or  */
	/* smoke is reported.                                                                     */
	/* High clouds (layer 1) - any form of cirrus or cirrostratus or cirrcumulus - are        */
	/* distinguished only by thin or thick.                                                   */
	/* Middle clouds (layer 2) - all forms of middle clouds are governed by rho2.             */
	/* Low clouds (layer 3) - we distinguished only between stratiform clouds (stratocumulus, */
	/* stratus, nimbostratus) and convective clouds (cumulus, cumulonimbus)                   */
	/*                                                                                        */
    /******************************************************************************************/

    double cza; // Cosine to solar zenith angle
    double cloudFraction; // Self explanatory
    boolean fog; // Indicates fog or smoke in layer 3
    boolean precip; // Indicates preciptation.
    // If yes, overcast is assumed in all three layers.
    // If no, sky is clear above lowest overcast layer
    boolean diffuse2 = false, diffuse3 = false; // Indicates if only diffuse radiation at cloudFraction >= 0.875
    int cloudType; // int from 1 to 5 indicating cloudtype, see below
    double R1, R2, R3; // Reflectivities
    double T1, T2, T3; // Transmissivities
    double R3clear, R3cloud, T3clear, T3cloud, R2d, R3d, T2d, T3d; // Reflectivities and transmissivities used with diffuse radiation (adopted from column labeled D in tables 2 and 3)
    double Rg = 0.15; // Ground albedo = 0.15 when no other information about ground available
    double p; // phi used to weight clear and overcast sky
    double w; // Weight for each cloud type as function of clud fraction and cosine of solar zenith angle
    int dayOfYear;
    final double SOLAR_CONST = 1369.2; //Solar constant

    /******************************************************************************************/
	/*                                                                                        */
	/* cloudType:  1 Thin ci/cs in layer 1, 2 Thick ci/cs in layer 1, 3 As/Ac in layer 2      */
	/*             4 Sc/st in layer 3. 5 Cu/cb in layer 3                                     */
	/*                                                                                        */
    /******************************************************************************************/

    public SolarRad(double zenithRad, int dayOfYear, double cloudFraction, int cloudType, boolean fog, boolean precip) {
        cza = Math.cos(zenithRad);
        this.cloudFraction = cloudFraction;
        this.cloudType = cloudType;
        this.fog = fog;
        this.precip = precip;
        this.dayOfYear = dayOfYear;
    }

    public SolarRad() {  }

    public double solarIrradiation() {
        double d_d2 = Math.pow(1.000140 + 0.016726*Math.cos( 2*Math.PI*(dayOfYear - 2) / 365), 2);
        double x0 = SOLAR_CONST * d_d2 * cza;
        double RT[] = cloudStates();
        // Eq. 9 p. 12 in Shapiro
        double D2 = 1 - (RT[0]*RT[1] + RT[1]*RT[2] + RT[2]*Rg) - (RT[0]*RT[2]*Math.pow(RT[4], 2) + RT[1]*Rg*Math.pow(RT[5], 2) + RT[0]*Rg*Math.pow(RT[4], 2)*Math.pow(RT[5], 2))
                + (RT[0]*Math.pow(RT[1], 2)*RT[2] + RT[1]*Math.pow(RT[2], 2)*Rg + RT[0]*RT[1]*RT[2]*Rg + RT[0]*Math.pow(RT[2], 2)*Rg*Math.pow(RT[4], 2) + RT[0]*Math.pow(RT[1], 2)*Rg*Math.pow(RT[5], 2))
                - RT[0]*Math.pow(RT[1], 2)*Math.pow(RT[2], 2)*Rg;

        return Math.round(RT[3]*RT[4]*RT[5]*x0 / d_d2);
    }

    public double[] cloudStates() {
        if (cloudFraction >= 0.875) { // Criterion for diffuse radiation and no direct radiation when Rk and Tk independent of cza
            if (cloudType == 3 & !precip) { // If thick cloud is situated in layer 2 then diffuse coefficients are used only in layer 3
                diffuse3 = true;

                if (fog) {
                    R3clear = 0.116;
                    T3clear = 0.788;
                }
                else {
                    R3clear = 0.045;
                    T3clear = 0.900;
                }
                R3cloud = 0.520;
                T3cloud = 0.400;
                R3d = cloudFraction * R3cloud + (1 - cloudFraction) * R3clear;
                T3d = cloudFraction * T3cloud + (1 - cloudFraction) * T3clear;
            }
            else if (cloudType == 2 & !precip) { // Clear-layer D-values used with thick ci/cs and clear layer 2
                diffuse2 = true;
                R2d = 0.040;
                T2d = 0.905;

                if (fog) {
                    R3d = 0.116;
                    T3d = 0.788;
                }
                else {
                    R3d = 0.045;
                    T3d = 0.900;
                }
            }
            else if (precip) { // R2, R3, T2, T3 based on overcast D-values in table 3
                diffuse2 = true;
                R2d = 0.560;
                T2d = 0.610;
                R3d = 0.520;
                T3d = 0.400;
            }
        }

        if (precip) { // Precipitation means thick ci/cs in layer 1, as/ac in layer 2, sc/st in layer 3
            double R[] = new double[4];
            double T[] = new double[4];
            for (int i = 1; i < 4; i++) {
                R[i] = reflectivityOvercast(i+1);
                T[i] = transmissivityOvercast(i+1);
                R1 = R[1]; R2 = R[2]; R3 = R[3];
                T1 = T[1]; T2 = T[2]; T3 = T[3];
            }
        }
        else {
            // Thin ci/cs in layer 1
            if (cloudType == 1) {
                R1 = phi(1) * reflectivityOvercast(1) + (1 - phi(1)) * reflectivityClear(1);
                R2 = phi(3) * reflectivityOvercast(3) + (1 - phi(3)) * reflectivityClear(2);
                T1 = phi(1) * transmissivityOvercast(1) + (1 - phi(1)) * transmissivityClear(1);
                T2 = phi(3) * transmissivityOvercast(3) + (1 - phi(3)) * transmissivityClear(2);

                if (!fog) {
                    R3 = reflectivityClear(3); // Assumes cloud cover only in layer 1
                    T3 = transmissivityClear(3);
                }
                else {
                    R3 = reflectivityClear(4);
                    T3 = transmissivityClear(4);
                }
            }
            // Thick ci/cs in layer 1
            else if (cloudType == 2) {
                R1 = phi(2) * reflectivityOvercast(2) + (1 - phi(2)) * reflectivityClear(1);
                R2 = phi(3) * reflectivityOvercast(3) + (1 - phi(3)) * reflectivityClear(2);
                T1 = phi(2) * transmissivityOvercast(2) + (1 - phi(2)) * transmissivityClear(1);
                T2 = phi(3) * transmissivityOvercast(3) + (1 - phi(3)) * transmissivityClear(2);

                if (!fog) {
                    R3 = reflectivityClear(3); // Assumes cloud cover only in layer 1
                    T3 = transmissivityClear(3);
                }
                else {
                    R3 = reflectivityClear(4);
                    T3 = transmissivityClear(4);
                }
            }
            // as/ac in layer 2
            else if (cloudType == 3) {
                R1 = reflectivityClear(1); // Assumes clear sky in layer 1 with clouds in layer 2
                R2 = phi(3) * reflectivityOvercast(3) + (1 - phi(3)) * reflectivityClear(2);
                T1 = transmissivityClear(1); // Assumes clear sky in layer 1 with clouds in layer 2
                T2 = phi(3) * transmissivityOvercast(3) + (1 - phi(3)) * transmissivityClear(2);

                if (!fog) {
                    R3 = reflectivityClear(3); // Assumes cloud cover only in layer 2
                    T3 = transmissivityClear(3);
                }
                else {
                    R3 = reflectivityClear(4);
                    T3 = transmissivityClear(4);
                }
            }
            // sc/st in layer 3
            else if (cloudType == 4) {
                R1 = reflectivityClear(1); // Assumes clear sky in layer 1 with clouds only in layer 3
                R2 = reflectivityClear(2); //// Assumes clear sky in layer 1 with clouds only in layer 3
                T1 = transmissivityClear(1); // Assumes clear sky in layer 1 with clouds in layer 2
                T2 = transmissivityClear(2);

                if (!fog) {
                    R3 = phi(4) * transmissivityOvercast(4) + (1 - phi(4)) * transmissivityClear(3);
                    T3 = phi(4) * transmissivityOvercast(4) + (1 - phi(4)) * transmissivityClear(3);
                }
                else {
                    R3 = phi(4) * transmissivityOvercast(4) + (1 - phi(4)) * transmissivityClear(4);
                    T3 = phi(4) * transmissivityOvercast(4) + (1 - phi(4)) * transmissivityClear(4);
                }
            }
            // cu/cb in layer 3
            else if (cloudType == 5) {
                R1 = reflectivityClear(1); // Assumes clear sky in layer 1 with clouds only in layer 3
                R2 = reflectivityClear(2); //// Assumes clear sky in layer 1 with clouds only in layer 3
                T1 = transmissivityClear(1); // Assumes clear sky in layer 1 with clouds in layer 2
                T2 = transmissivityClear(2);
                if (!fog) {
                    R3 = phi(5) * transmissivityOvercast(5) + (1 - phi(5)) * transmissivityClear(3);
                    T3 = phi(5) * transmissivityOvercast(5) + (1 - phi(5)) * transmissivityClear(3);
                }
                else {
                    R3 = phi(5) * transmissivityOvercast(5) + (1 - phi(5)) * transmissivityClear(4);
                    T3 = phi(5) * transmissivityOvercast(5) + (1 - phi(5)) * transmissivityClear(4);
                }
            }
        }

        if (diffuse3) {
            R3 = R3d;
            T3 = T3d; }
        if (diffuse2) {
            R2 = R2d;
            T2 = T2d;
            R3 = R3d;
            T3 = T3d; }

        double[] RT = {round(R1), round(R2), round(R3), round(T1), round(T2), round(T3)};
        //      System.out.println(" R1: " + RT[0] + ", R2: " + RT[1] + ", R3: " + RT[2] + ", T1: " + RT[3] + ", T2: " + RT[4] + ", T3: " + RT[5]);
        return RT;
    }

    public double phi(int i) { // parameter used with fractional cloud cover
        p = (i == cloudType) ? (weight(i) * cloudFraction) : 0;
        return p;
    }

    public double reflectivityClear(int i) {
        double r = reflClear[i-1][0] + reflClear[i-1][1] * cza + reflClear[i-1][2] * Math.pow(cza, 2) + reflClear[i-1][3] * Math.pow(cza, 3);
        //         System.out.println("r" + i + ": " + r);
        return r;
    }

    public double reflectivityOvercast(int i) {
        double rho = reflOvercast[i-1][0] + reflOvercast[i-1][1] * cza + reflOvercast[i-1][2] * Math.pow(cza, 2) + reflOvercast[i-1][3] * Math.pow(cza, 3);
        //         System.out.println("rho" + i + ": " + rho[i]);
        return rho;
    }


    public double transmissivityClear(int i) {
        double t = transClear[i-1][0] + transClear[i-1][1] * cza + transClear[i-1][2] * Math.pow(cza, 2) + transClear[i-1][3] * Math.pow(cza, 3);
        //         System.out.println("t" + i + ": " + t[i]);
        return t;
    }

    public double transmissivityOvercast(int i) {
        double tau = transOvercast[i-1][0] + transOvercast[i-1][1] * cza + transOvercast[i-1][2] * Math.pow(cza, 2) + transOvercast[i-1][3] * Math.pow(cza, 3);
        return tau;
    }

    public double weight(int i) {
        double w;
        if (cloudFraction == 0) {
            w = 0;
        } else if (cloudFraction == 1) {
            w = 1;
        } else {
            w = c[i-1][0] + c[i-1][1] * cza + c[i-1][2] * cloudFraction + c[i-1][3] * cza + c[i-1][4] * Math.pow(cza, 2) + c[i-1][5] * Math.pow(cloudFraction, 2);
        }
        return w;
    }

    public void setAllInput(double zenithRad, int dayOfYear, double cloudFraction, int cloudType, boolean fog, boolean precip) {
        cza = Math.cos(zenithRad);
        this.cloudFraction = cloudFraction;
        this.cloudType = cloudType;
        this.fog = fog;
        this.precip = precip;
        this.dayOfYear = dayOfYear;
    }

    public void setAlbedo(double albedo) {
        Rg = albedo;
    }

    public void setFog(boolean fog) {
        this.fog = fog;
    }

    public void setPrecip(boolean precip) {
        this.precip = precip;
    }

    public void setDayOfYear(int dayOfYear) {
        this.dayOfYear = dayOfYear;
    }

    public void setZenith (double zenithRad) {
        this.cza = Math.cos(zenithRad);
    }

    public void setCloudFraction(double cloudFraction) {
        this.cloudFraction = cloudFraction;
    }

    public void setCloudType(int cloudType) {
        this.cloudType = cloudType;
    }

    public double round(double tal) {
        return Math.round(tal*1000) / 1000.0;
    }

    double reflClear[][] = {                //Reflectivity clear layers
            {0.12395, -0.34765, 0.39478, -0.14627}, // r1 clear layer 1
            {0.15325, -0.39620, 0.42095, -0.14200}, // r2 clear layer 2
            {0.15946, -0.42185, 0.48800, -0.18493}, // r3 clear layer 3
            {0.27436, -0.43132, 0.26920, -0.00447}}; // r3 with smoke or fog (F/K)

    double reflOvercast[][] = {             //Reflectivity overcast layers
            {0.25674, -0.18077, -0.21961, 0.25272}, // rho1 thin Ci/Cs in layer 1
            {0.60540, -0.55142, -0.23389, 0.43648}, // rho1 thick Ci/cs in layer 1
            {0.66152, -0.14863, -0.08193, 0.13442}, // rho2 As/Ac
            {0.71214, -0.15033, 0.00696, 0.03904},  // rho3 Sc/St
            {0.67072, -0.13805, -0.10895, 0.09460}}; // rho3 Cu/cb

    double transClear[][] = {              //Transmissivity clear layers
            {0.76977, 0.49407, -0.44647, 0.11558}, // t1 clear layer 1
            {0.69318, 0.68227, -0.64289, 0.17910}, // t2 clear layer 2
            {0.68679, 0.71012, -0.71463, 0.22339}, // t3 clear layer 3
            {0.55336, 0.61511, -0.29816, -0.0663}}; // t3 with smoke or fog (F/K)

    double transOvercast[][] = {           //Transmissivity overcast layers
            {0.63547, 0.35229, 0.08709, -0.22902}, // tau1 thin Ci/Cs in layer 1
            {0.26458, 0.66829, 0.24228, -0.49357}, // tau1 thick Ci/Cs in layer 1
            {0.19085, 0.32817, -0.08613, -0.08197},// tau2 As/Ac in layer 2
            {0.13610, 0.29964, -0.14041, 0.00952}, // tau3 Sc/St in layer 3
            {0.17960, 0.34855, -0.14875, 0.01962}};// tau3 Cu/Cb in layer 3

    double c[][] = {                              //Coefficients to use in bi-quadratic estimation of w
            {0.675, -3.432, 1.929, 0.842, 2.693, -1.354}, // Thin Ci/Cs
            {1.552, -1.957, -1.762, 2.067, 0.448, 0.932}, // Thick Ci/Cs
            {1.429, -1.207, -2.008, 0.853, 0.324, 1.582}, // As/Ac
            {0.858, -1.075, -0.536, 0.750, 0.322, 0.501}, // Sc/St
            {2.165, -1.277, -3.785, 2.089, -0.387, 2.342}}; // Cu/Cb

    double albedoGroundDry[] = {
            0.13, //Dark
            0.18, //Light
            0.08, //Dark-ploughed
            0.16, //Light-ploughed
            0.23, //Clay
            0.25, //Sandy
            0.40, //Sand
            0.55  //White sand
    };

    double albedoGroundWet[] = {
            0.08, //Dark
            0.10, //Light
            0.06, //Dark-ploughed
            0.08, //Light-ploughed
            0.16, //Clay
            0.18, //Sandy
            0.20, //Sand
    };

    double albedoSurfaces[] = {
            0.10, //Asphalt, lava
            0.20, //Tundra, steppe
            0.30, //Concrete, stone, desert
            0.35, //Rock, dry
            0.20, //Rock, wet
            0.25, //Dirt road, dry
            0.18, //Dirt road, wet
            0.30, //Clay road, dry
            0.20  //Clay road, wet
    };

    double albedoFieldsGrowing[] = {
            0.18, //Tall grass, growing
            0.26, //Mowed grass, growing
            0.18, //Desiduous trees, growing
            0.14, //Coniferous trees, growing
            0.12, //Rice, growing
            0.18, //Beet, wheat, growing
            0.19, //Potato, growing
            0.20, //Rye, growing
            0.21, //Cotton, growing
            0.22, //Lettuce, growing
            0.13, //Tall grass, dormant
            0.19, //Mowed grass, dormant
            0.12, //Desiduous trees, dormant
            0.12, //Coniferous trees, dormant
            0.16, //Verdure indifferent - average of values in Shapiro 1982
    };
}
