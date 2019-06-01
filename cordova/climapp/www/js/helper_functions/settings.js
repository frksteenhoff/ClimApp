function getCalculatedHeightValue(unit, height) {
    if(unit != "SI") { // feet, inches
        return Math.round(height / 30.48); 
    } else { // cm
        return height;
    }
}

function getHeightUnit(unit) {
    if(["SI", "UK", "US"].includes(unit)) {
        return unit === "SI" ? "cm" : "feet";
    } else {
        return "Wrong unit";
    }
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

function deviceID() {
    return device.uuid;
}

function getGenderAsInteger(kb) {
    return kb.user.settings.gender === 'Male' ? 1 : 0;
}

module.exports = { getCalculatedHeightValue, getHeightUnit, getCalculatedWeightValue, getWeightUnit, deviceID, getGenderAsInteger };

