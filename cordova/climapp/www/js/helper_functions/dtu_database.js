// Functionality (CRUD operations) performed on the DTU database.

/* 
 * Asynchronous functions.
 */

// kb - shorthand for self.knowledgeBase.feedback 
function addFeedbackToDB(kb){
    let apicall = "createFeedbackRecord";
    let url = kb.user_info.dtu_ip + kb.user_info.dtu_api_base_url + apicall;
    let user_data = {
                "user_id": deviceID(),
                "question_combo_id": 1, // will be changed when more sophisticaed solution is implemented
                "rating1": kb.question1.rating, 
                "rating2": kb.question2.rating,
                "rating3": kb.question3.rating, 
                "txt": kb.comment === "" ? "_" : kb.feedback.comment 				
            }  
    $.post(url, user_data).done(function(data, status, xhr){
        if(status === "success") {
            console.log("Database update, feedback: " + data);
            showShortToast("Feedback submitted!");
        }
    });
}

// Create user record in dtu database, kb shorthand for self.knowledgebase
function createUserRecord(kb){
    let apicall = "createUserRecord";
    let url = kb.user_info.dtu_ip + kb.user_info.dtu_api_base_url + apicall;
    let user_data = {"_id": deviceID(),
                     "age": kb.settings.age.value,
                     "gender": getGenderAsInteger(kb), 
                     "height": (kb.settings.height.value/100), // unit is meter in database (SI)
                     "weight": kb.settings.weight.value, 
                     "unit": 0}  
    $.post(url, user_data).done(function(data, status, xhr){
        if(status === "success") {
            console.log("Database update, user: " + data);
            // Only update this value if user has been added to database
            return true;
        } else {
            return false;
        }
    });
}

// Updating user parameter in database when/if user should choose to change the value
function updateDBParam(kb, param){
    let apicall = "updateUser";
    let urlsuffix = kb.user_info.dtu_ip + kb.user_info.dtu_api_base_url + apicall;
    let fieldToUpdate = param.charAt(0).toUpperCase() + param.slice(1); // Capitalizing to match API requirement		
	let url = urlsuffix + fieldToUpdate;
	let user_data = {
			"_id": deviceID(),		
		}
	// Add value to be updated to data object 
	if(param === "gender") { 
		user_data[param] = getGenderAsInteger(kb);
	} else {
		user_data[param] = kb.settings[param].value;
	}
	$.post(url, user_data).done(function(data, status, xhr){
		if(status === "success") {
			console.log("Database update" + param + ": " + 
			kb.settings[param].value + ", " + 
			getGenderAsInteger(kb));
		}
	});
}

function addWeatherDataToDB(kb){
    let apicall = "createWeatherRecord";
    let url = kb.user_info.dtu_ip + kb.user_info.dtu_api_base_url + apicall;
    let user_data = {
                "_id": deviceID(),
                "longitude": kb.weather.lat,
                "latitude": kb.weather.lng, 
                "city": kb.weather.station,
                "temperature": kb.weather.temperature[0], 
                "wind_speed": kb.weather.windspeed[0], 
                "humidity": kb.weather.humidity[0]/100, 
                "cloudiness": 0, // Not in knowledgebase?
                "activity_level": kb.activity.selected,
                "acclimatization": 0, // currently not retrieved from sensationsmaps
                "temp_min": 0, // currently not retrieved from sensationsmaps
                "temp_max": 0 // currently not retrieved from sensationsmaps
            }  
    $.post(url, user_data).done(function(data, status, xhr){
        if(status === "success") {
            console.log("Database update, weather: " + data);
        }
    });
}

/*
 * Synchronous functions
 */

// Retrieving app id from dtu database. Needs to be synchronous as the response is used in subsequent functions.
function getAppIDFromDB(kb) {
	return new Promise((resolve, reject) => {
		let apicall = "getAppID";
        let url = kb.user_info.dtu_ip + kb.user_info.dtu_api_base_url + apicall;
		let user_data = {
					"user_id": deviceID()
				}  
		$.get(url, user_data).done(function(data, status, xhr){
			if(status === "success") {
				let response = JSON.parse(data);
				resolve(response.config[0].appid); 
			} else {
				reject(false); 
			}
		});
	})
}

module.exports = {addFeedbackToDB, createUserRecord, updateDBParam, addWeatherDataToDB, getAppIDFromDB};