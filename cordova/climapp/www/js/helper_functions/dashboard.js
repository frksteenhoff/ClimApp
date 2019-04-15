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


// kb shorthand for knowledgeBase
function BSA(kb) {
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let w = kb.settings.weight.value; //kg
        let h = kb.settings.height.value / 100; //m
        return ( Math.pow(h, 0.725) * 0.20247 * Math.pow(w, 0.425 ) );//dubois & dubois 
    }
}

function M(kb) {
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let ISO_selected = kb.activity.selected;
        let ISO_level = kb.activity.values[ ISO_selected ];
        return 50 * (ISO_level);
    }
}

function RAL(kb) {
    let M_ = M(kb); //W/m2
    let BSA_ = BSA(kb); //m2
    let watt = M_ * BSA_;
    return 59.9 - 14.1 * Math.log10( watt );
}

function WBGTrisk(wbgt, kb) {
    let RAL_ = RAL(kb);
    let risk = wbgt / RAL_; 
    if (risk >= 1.2 ){
        return 3 * ( risk / 1.2 );
    } else if (risk > 1.0 ){
        return 2 * ( risk );
    } else if (risk <= 1.0 ){
        return ( risk / 0.8); // scale 0.8 to 1
    }
}