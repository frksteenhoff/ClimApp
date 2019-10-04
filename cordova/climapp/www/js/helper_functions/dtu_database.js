// Functionality (CRUD operations) performed on the DTU database.

/* 
 * Asynchronous functions.
 */

// kb - shorthand for self.knowledgeBase 
function addFeedbackToDB(kb, translations, language) {
    let apicall = "createExtendedFeedbackRecord";
    let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
    let thermal_mode = kb.user.adaptation.mode;
    let user_data = {
        "user_id": deviceID(),
        "question_combo_id": 1, // will be changed when more sophisticated solution is implemented
        "rating1": kb.feedback.question1.rating,
        "rating2": kb.feedback.question2.rating,
        "rating3": kb.feedback.question3.rating,
        "txt": kb.feedback.comment === "" ? "_" : kb.feedback.comment,
        "predicted": kb.user.adaptation[thermal_mode].predicted,
        "perceived": kb.user.adaptation[thermal_mode].perceived,
        "diff": kb.user.adaptation[thermal_mode].diff[0],
        "mode": thermal_mode
    }
    $.post(url, user_data).done(function (data, status, xhr) {
        if (status === "success") {
            console.log("Database update, feedback: " + data);
            showShortToast(translations.toasts.feedback_submitted[language]);
        }
    });
}


// Updating user parameter in database when/if user should choose to change the value
function updateDBParam(kb, param) {
    let apicall = "updateUser";
    let urlsuffix = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
    let fieldToUpdate = param.charAt(0).toUpperCase() + param.slice(1); // Capitalizing to match API requirement		
    let url = urlsuffix + fieldToUpdate;
    let user_data = {
        "_id": deviceID(),
    }
    // Add value to be updated to data object 
    if (param === "gender") {
        user_data[param] = getGenderAsInteger(kb);
    } else {
        user_data[param] = kb.user.settings[param];
    }
    $.post(url, user_data).done(function (data, status, xhr) {
        if (status === "success") {
            console.log("Database update, " + param + ": " +
                kb.user.settings[param] + ", " +
                getGenderAsInteger(kb));
        }
    });
}

function addWeatherDataToDB(kb) {
    let apicall = "createWeatherRecord";
    let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
    let acc = kb.user.acclimatization ? 1 : 0;

    let user_data = {
        "_id": deviceID(),
        "longitude": kb.weather.lat,
        "latitude": kb.weather.lng,
        "city": kb.weather.station,
        "temperature": kb.weather.temperature[0],
        "wind_speed": kb.weather.windspeed[0],
        "humidity": kb.weather.humidity[0] / 100,
        "cloudiness": 0, // Not in knowledgebase?
        "activity_level": kb.user.settings.activity_selected,
        "acclimatization": acc,
        "temp_min": 0, // currently not retrieved from sensationsmaps
        "temp_max": 0 // currently not retrieved from sensationsmaps
    }
    $.post(url, user_data).done(function (data, status, xhr) {
        if (status === "success") {
            console.log("Database update, weather: " + data);
        }
    });
}

/*
* Synchronous functions
*/
// Create user record in dtu database, kb shorthand for self.knowledgebase
function createUserRecord(kb) {
    return new Promise((resolve, reject) => {
        let apicall = "createUserRecord";
        let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
        let user_data = {
            "_id": deviceID(),
            "age": kb.user.settings.age,
            "gender": getGenderAsInteger(kb.user.settings.gender),
            "height": (kb.user.settings.height / 100), // unit is meter in database (SI)
            "weight": kb.user.settings.weight,
            "unit": 0
        }
        $.post(url, user_data).done(function (data, status, xhr) {
            if (status === "success") {
                console.log("Database update, user: " + data);
                // Only update this value if user has been added to database
                resolve(true);
            } else {
                console.log("The user might already exist.");
                reject(false);
            }
        });
    })
}

// Retrieving app id from dtu database. Needs to be synchronous as the response is used in subsequent functions.
function getAppIDFromDB(kb) {
    return new Promise((resolve, reject) => {
        let apicall = "getAppID";
        let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
        let user_data = {
            "user_id": deviceID()
        }
        //@Henriette, .done is not always reached
        $.get(url, user_data).done(function (data, status, xhr) {
            if (status === "success") {
                let response = JSON.parse(data);
                let appID = response.config[0].appid;
                console.log("Fetched app ID: " + appID);
                resolve(appID);
            } else {
                console.log("Could not fetch app ID from server.");
                reject(false);
            }
        }).fail(function (data) {
            resolve("f22065144b2119439a589cbfb9d851d3");//fix for boris, whose id seems to be having issues at DTU server
        });
    })
}

function getIndoorPrediction(kb) {
    return new Promise((resolve, reject) => {
        let apicall = "getIndoorPrediction";
        let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
        let user_data = {
            "wo": kb.user.settings.open_windows, // window opening 0/1
            "trv": kb.user.settings.thermostat_level, // heating setpoint (radiator valve/thermostat)
            "cy": 1950, // building construction year [1920,1930 .. 2010]
            "fa": 40, // floor area 5-200m^2 
            "no": 3, // number of occupants in room (1-5)
            "tao": kb.thermalindices.ireq[0].Tair, // outdoor temp (degrees celcius)
            "rho": kb.thermalindices.ireq[0].rh, // outdoor relative humidity %
            "sr": kb.thermalindices.ireq[0].rad // solar radiation W/m^2
        }
        $.post(url, user_data).done(function (data, status, xhr) {
            if (status === "success") {
                let response = JSON.parse(data);
                let indoorTemperature = response.temp;
                console.log("Retrieved predicted temperature from server: " + indoorTemperature);
                resolve(indoorTemperature);
            } else {
                console.log("Failed to retrieve temperature prediction from server.");
                reject(false);
            }
        });
    })
}