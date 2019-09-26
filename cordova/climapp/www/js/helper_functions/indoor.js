function getWheelStartingValueIndoor(target, kb, translations, language) {
    var currentValueAsString = "";
	// Setting starting value in wheel based on target
    switch (target) {
        case "thermostat_level":
            currentValueAsString = "" + kb.user.settings[target];
            break;
        case "open_windows":
            currentValueAsString = kb.user.settings[target] == 1 ? translations.labels.str_yes[language] : translations.labels.str_no[language];
            break;
        case "windspeed":
            if(kb.user.settings[target] == 2) {
                currentValueAsString = translations.wheels.windspeed.description.some_wind[language];
            } else if(kb.user.settings[target] == 3) {
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