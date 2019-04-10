function getCalculatedHeightValue(unit, height) {
    if(unit != "SI") { // feet, inches
        return Math.round(height / 30.48); 
    } else { // cm
        return height;
    }
}

function getHeightUnit(unit) {
    return unit === "SI" ? "cm" : "feet";
}

function getCalculatedWeightValue(unit, weight) {
    switch(unit) {
        case "US": // pounds
             return Math.round(weight * 2.2046);
        case "UK": // stones
            return Math.round(weight * 0.1574);
        default:
            return weight;
    }
}

function getWeightUnit(unit) {
    if(unit === "SI") {
        return "kg";
    } else if(unit === "US") {
        return "lbs"
    } else {
        return "stones"
    }   
}