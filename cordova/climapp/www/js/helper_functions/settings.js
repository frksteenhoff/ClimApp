// TODO: change structure of units, make one wheel to set all units individually
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

// Check whether gender has been set.
// If gender is a number (0 or 1) return that, otherwise 
// return -1 (when gender is 'undefined')
function getGenderAsInteger(gender) {
    return typeof gender === 'number' ? gender : -1;
}

function getWheelStartingValueSettings(target, kb, translations, language) {
    var currentValueAsString = "";
	// Setting starting value in wheel based on target
    switch (target) {
        case "age":
            currentValueAsString = kb.user.settings.yearOfBirth + "";
            break;
        case "height":
            currentValueAsString = kb.user.settings.height + " cm";
            break;
        case "weight":
            currentValueAsString = kb.user.settings.weight + " kg";
            break;
        case "gender":
            if(kb.user.settings.gender != "undefined") {
                currentValueAsString = kb.user.settings.gender == 0 ? translations.labels.str_female[language] : translations.labels.str_male[language];
            } else {
                // Female if undefined (after first download)
                currentValueAsString = translations.labels.str_female[language];
            }
            break;
        case "unit":
            if(kb.user.settings.unit === "US") {
                currentValueAsString = "US: lbs, inch, m/s, Fahrenheit";
            } else if(kb.user.settings.unit === "UK") {
                currentValueAsString = "UK: stone, inch, m/s, Celsius";
            } else {
                currentValueAsString = "SI: kg, cm, m/s, Celsius";
            }
            break;
    }
    return currentValueAsString;
}

function getWheelStartingValueIndoor(target, kb, translations, language) {
    var currentValueAsString = "";
	// Setting starting value in wheel based on target
    switch (target) {
        case "thermostat_level":
            currentValueAsString = "" + kb.user.settings[target];
            break;
        case "open_windows":
            currentValueAsString = kb.user.settings[target] === 1 ? translations.labels.str_yes[language] : translations.labels.str_no[language];
            break;
        case "windspeed":
            if(kb.user.settings[target] === 2) {
                currentValueAsString = translations.wheels.windspeed.description.some_wind[language];
            } else if(kb.user.settings[target] === 3) {
                currentValueAsString = translations.wheels.windspeed.description.strong_wind[language];
            } else { // no wind
                currentValueAsString = translations.wheels.windspeed.description.no_wind[language];
            }
            break;
        case "_humidity":
            currentValueAsString = kb.user.settings[target] + " %";
            break;
    }
    return currentValueAsString;
}