// Functionality (CRUD operations) performed on the DTU database.

/* 
 * Asynchronous functions.
 */

// kb - shorthand for self.knowledgeBase 
function addFeedbackToDB(kb, feedback_questions, translations, language) {
    let apicall = "createExtendedFeedbackRecord";
    let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
    let thermal_mode = kb.user.adaptation.mode;
    let user_data = {
        "user_id": deviceID(),
        "question_combo_id": 1, // will be changed when more sophisticated solution is implemented
        "rating1": feedback_questions.question1.rating,
        "rating2": feedback_questions.question2.rating,
        "rating3": feedback_questions.question3.rating,
        "txt": "_",
        "predicted": kb.user.adaptation[thermal_mode].predicted,
        "perceived": kb.user.adaptation[thermal_mode].perceived,
        "diff": kb.user.adaptation[thermal_mode].diff,
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
	let station = kb.weather.station.indexOf( "<br>" ) > -1 ? kb.weather.station.substring(kb.weather.station.indexOf("<br>") + 4 ): kb.weather.station;
    let user_data = {
        "_id": deviceID(),
        "longitude": kb.weather.lat,
        "latitude": kb.weather.lng,
        "city": station,
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

function addUseDataToDB(kb, context){
	
	let apicall= "insertDataUsage";
	let url = "http://www.sensationmapps.com/climapp/api.php";
	let station = kb.weather.station.indexOf( "<br>" ) > -1 ? kb.weather.station.substring(kb.weather.station.indexOf("<br>") + 4 ): kb.weather.station;
    
	var icl_min = kb.thermalindices.ireq[0].ICLminimal;
	var icl_neutral = kb.thermalindices.ireq[0].ICLneutral;
	var icl_worn = getClo(kb);
	
	var personal_cold_index = context.calculateColdIndex( icl_neutral, icl_min, icl_worn, true); 
	var model_cold_index = context.calculateColdIndex( icl_neutral, icl_min, icl_worn, false); 
	var personal_heat_index = WBGTrisk( kb.thermalindices.phs[0].wbgt, kb, true );
	var model_heat_index = WBGTrisk( kb.thermalindices.phs[0].wbgt, kb, false );			
	
	var isIndoor = kb.user.guards.isIndoor ? 1 : 0;
	
	let draw_heat_gauge = context.isDrawHeatGauge( model_cold_index, model_heat_index, 0 );
	var thermal = draw_heat_gauge ? "heat" : "cold";
	
	let CAV = getCAF(kb);
	let RAL_ = RAL(kb);
	
	let user_data = {
        "_id": deviceID(),
        "lon": kb.weather.lat,
        "lat": kb.weather.lng,
        "station": station,
		//
		"yearOfBirth" : kb.user.settings.yearOfBirth,
		"age": kb.user.settings.age,
		"height": kb.user.settings.height,
		"weight": kb.user.settings.weight,
		"gender": kb.user.settings.gender,
		"acclimatization": kb.user.settings.acclimatization,
		//main indices
		"ireq_min": kb.thermalindices.ireq[0].ICLminimal,
		"ireq_dlim_min": kb.thermalindices.ireq[0].DLEminimal,
		"ireq_neutral": kb.thermalindices.ireq[0].ICLneutral,
		"phs_dtre": kb.thermalindices.phs[0].D_Tre,
		"phs_dwl50": kb.thermalindices.phs[0].Dwl50,
		"phs_swtotg": kb.thermalindices.phs[0].SWtotg,
		"pmv": kb.thermalindices.pmv[0].PMV,
		"ppd": kb.thermalindices.pmv[0].PPD,
		"utci": kb.thermalindices.utci[0].utci_temperature,
		//inputs
		"M": kb.thermalindices.ireq[0].M,
		"Icl": kb.thermalindices.ireq[0].Icl,
		"p": kb.thermalindices.ireq[0].p,
		"im_st": kb.thermalindices.ireq[0].im_st,
		"Tair": kb.thermalindices.ireq[0].Tair,
		"Trad": kb.thermalindices.ireq[0].Trad,
		"Tglobe": kb.thermalindices.ireq[0].Tglobe,
		"v_air10": kb.thermalindices.ireq[0].v_air10, //@10m
		"v_air": kb.thermalindices.ireq[0].v_air, //@2m
		"rh": kb.thermalindices.ireq[0].rh,
		"clouds": kb.thermalindices.ireq[0].clouds,
		"rain": kb.thermalindices.ireq[0].rain,
		"rad": kb.thermalindices.ireq[0].rad,
		"wbgt": kb.thermalindices.ireq[0].wbgt,
		"wbgt_max": kb.thermalindices.ireq[0].wbgt_max,
		"windchill": kb.thermalindices.ireq[0].windchill,
		"utc": kb.thermalindices.ireq[0].utc,
		//climapp specials
		"cav": CAV,
		"ral": RAL_,
		"thermal": thermal,
		"isIndoor": isIndoor,
		"model_heat_score": model_heat_index,
		"model_cold_score": model_cold_index,
		//perception
		"perception_heat": kb.user.adaptation.heat.perceived,
		"perception_cold": kb.user.adaptation.cold.perceived
	};
	let json = JSON.stringify( user_data );
    $.post(url, {"action": apicall, "json": json } ).done(function (data, status, xhr) {
        console.log(" status: " + status );
        console.log(" data: " + data );
        console.log(" xhr: " + JSON.stringify(xhr) );
		
		showShortToast("Thank you");
		
    }).fail(function (data){
		showShortToast("Submit Failed");
    	console.log( data );
    });
	
}

/*
* Synchronous functions
*/
// Create user record in dtu database, kb shorthand for self.knowledgebase
async function createUserRecord(kb) {
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
        }).fail(function (data){
			showShortToast("Copenhagen University server issue - Create User");
		
    		console.log( data );
            reject(false);
			
    	});
    })
}

// Retrieving app id from dtu database. Needs to be synchronous as the response is used in subsequent functions.
function getAppIDFromDB(kb) {
	console.log( "getAppIDFromDB => new Promise ");
	
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
                resolve(appID);
            } else {
                console.log("Could not fetch app ID from server.");
                reject(false);
            }
        }).fail(function (data) {
			console.log( "failed get app id from DB ");
			
			$.get("http://www.sensationmapps.com/WBGT/api/thermaladvisor.php",
				  {"mode": "emergencykey"}, 
				 function( data){
				 resolve( data );
			});
        });
    })
}

function getIndoorPrediction(kb) {
    return new Promise((resolve, reject) => {
        let apicall = "getIndoorPrediction";
        let url = kb.server.dtu_ip + kb.server.dtu_api_base_url + apicall;
		let sr = Math.round( kb.thermalindices.ireq[0].rad );
		
        let user_data = {
            "rho": kb.thermalindices.ireq[0].rh, // outdoor relative humidity %
            "sr": sr, // solar radiation W/m^2
            "tao": kb.thermalindices.ireq[0].Tair, // outdoor temp (degrees celcius)
            "wo": kb.user.settings.open_windows, // window opening 0/1
            "trv": kb.user.settings.thermostat_level, // heating setpoint (radiator valve/thermostat)
            "cy": 1950, // building construction year [1920,1930 .. 2010]
            "fa": 40, // floor area 5-200m^2 
            "no": 3 // number of occupants in room (1-5)
        };
        console.log("getting indoor prediction:" + JSON.stringify( user_data ) );
		
        $.post(url, user_data).done(function (data, status, xhr) {
            if (status === "success") {
		        console.log("indoor prediction succes");
		        console.log( data );
				
                let response = JSON.parse(data);
                let indoorTemperature = response.temp;
				console.log( data );
                console.log("Retrieved predicted temperature from server: " + indoorTemperature);
                resolve(indoorTemperature);
            } else {
                console.log("Failed to retrieve temperature prediction from server.");
                reject(false);
            }
        });
    })
}