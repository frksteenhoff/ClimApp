/* Function related to the dashboard */

function gaugeTitleCold(val) {
    if ( val <= 1 ) return "no thermal stress";
    else if ( val < 2 ) return "minor cold stress";
    else if ( val < 3 ) return "significant cold stress";
    else if ( val < 4 ) return "high cold stress";
    else if ( val < 5 ) return "severe cold stress";
    else return "extreme cold stress";
}

function gaugeTitleHeat(val) {
    if ( val < 1 ) return "no thermal stress";
    else if ( val < 2 ) return "minor heat stress";
    else if ( val < 3 ) return "significant heat stress";
    else if ( val < 4 ) return "high heat stress";
    else if ( val < 5 ) return "severe heat stress";
    else return "extreme heat stress"; 
}

function getTemperatureUnit(unit) {
    return unit === "US" ? "Fahrenheit" : "Celcius";
}

function windchillRisk(windchill) {
    if( windchill <-50 ){
        return 2;
    } else if( windchill < -40 ){
        return 10;
    } else if( windchill < -20 ){
        return 30;
    } else if( windchill < -15 ){
        return 60;
    } else return false; //no risk
}
