/* Function related to the dashboard */

function gaugeTitleCold(val, translations, language) {
	var labels = translations.labels;
    if ( val <= 1 ) return labels.str_no_stress[language];
    else if ( val < 2 ) return labels.str_cold_minor[language];
    else if ( val < 3 ) return labels.str_cold_significant[language];
    else if ( val < 4 ) return labels.str_cold_high[language];
    else if ( val < 5 ) return labels.str_cold_severe[language];
    else return labels.str_cold_extreme[language];
}

function gaugeTitleHeat(val, translations, language) {
	console.log( val+  " " + language );
	var labels = translations.labels;
    if ( val < 1 ) return labels.str_no_stress[language];
    else if ( val < 2 ) return labels.str_heat_minor[language];
    else if ( val < 3 ) return labels.str_heat_significant[language];
    else if ( val < 4 ) return labels.str_heat_high[language];
    else if ( val < 5 ) return labels.str_heat_severe[language];
    else return labels.str_heat_extreme[language];
}

function getWindspeedUnit(unit) {
    return unit === "US" ? "m/s" : "m/s";
}
function getTemperatureUnit(unit) {
    return unit === "US" ? "&#8457;" : "&#8451;";
}
function getTemperatureValueInPreferredUnit(temp, unit) {
	if(unit === "US") {
		return temp * 9/5 + 32;
	} else {
		return temp;
	}
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
function BSA(kb) { //m2
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let w = kb.user.settings.weight; //kg
        let h = kb.user.settings.height / 100; //m
        return ( Math.pow(h, 0.725) * 0.20247 * Math.pow(w, 0.425 ) );//dubois & dubois 
    }
}

function M(kb) { //W/m2
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let ISO_selected = kb.user.settings.activity_selected;
		return kb.activity.values[ ISO_selected ] / BSA(kb);
    }
}

function getClo(kb){
	let clokey = kb.user.settings.clothing_selected;
	let helmetkey = kb.user.settings.headgear_selected;
	return kb.clothing.values[clokey] + kb.headgear.values[helmetkey];
}
function getAirPermeability(kb){
	let clokey = kb.user.settings.clothing_selected; //check vals with chuansi
	let values = { "Summer_attire": 100, 
					"Business_suit": 50,
					"Double_layer": 25,
					"Cloth_coverall": 5,
					"Cloth_apron_long_sleeve": 5,
					"Vapour_barrier_coverall": 1,
					"Winter_attire": 5 };
	return values[clokey];
}

function getMoisturePermeability(kb){
	let clokey = kb.user.settings.clothing_selected; //check vals with chuansi
	let values = { "Summer_attire": 0.45, 
					"Business_suit": 0.38,
					"Double_layer": 0.38,
					"Cloth_coverall": 0.38,
					"Cloth_apron_long_sleeve": 0.09,
					"Vapour_barrier_coverall": 0.09,
					"Winter_attire": 0.19 };
	return values[clokey];
}

function RAL(kb) {
    let M_ = M(kb); //W/m2
    let BSA_ = BSA(kb); //m2
    let watt = M_ * BSA_;
	if( kb.user.settings.acclimatization ){
	    return 56.7 - 11.5 * Math.log10( watt ); //ISO7243 acclimatised
	}
	else{
	    return 59.9 - 14.1 * Math.log10( watt );
	}
}

function getCAF(kb){
	let clothingvalues = { "Summer_attire": 0, 
							"Business_suit": 0,
							"Double_layer": 3,
							"Cloth_coverall": 0,
							"Cloth_apron_long_sleeve": 4,
							"Vapour_barrier_coverall": 10,
							"Winter_attire": 3 };
	let headvalues = { "none": 0, 
					   "helmet": 1};
	let clokey = kb.user.settings.clothing_selected;
	let helmetkey = kb.user.settings.headgear_selected;
	return ( clothingvalues[clokey] + headvalues[helmetkey] );
}

function isClothingCovering(kb){
	let clothingvalues = { "Summer_attire": "no", 
						"Business_suit": "yes",
						"Double_layer": "yes",
						"Cloth_coverall": "yes",
						"Cloth_apron_long_sleeve": "yes",
						"Vapour_barrier_coverall": "yes",
						"Winter_attire": "yes" };
   let clokey = kb.user.settings.clothing_selected;
   return clothingvalues[clokey];
}

function getWBGTeffective(wbgt, kb){
	let caf = getCAF(kb);
	return 1.0 * wbgt + caf;
}

function getPAL(kb, thermal){ //personal adjustment value 
	return kb.user.adaptation[thermal].diff.length > 0 ? kb.user.adaptation[thermal].diff[0] : 0;
}

		   
function WBGTrisk(wbgt, kb, isPersonalised ) {
	let RAL_ = RAL(kb);
	let PAL = isPersonalised ? getPAL(kb, "heat") : 0;//personal adjustment value
	let wbgt_effective = getWBGTeffective(wbgt, kb);
	let RAL_effective = (RAL_ - PAL);
	let risk = wbgt_effective / RAL_effective;  
	
	if( risk <= 0.8 ){
		//class = "green";
		return risk / 0.8; //scale to max 1
	}
	else if( risk <= 1.0 ){
		//class = "orange";
		return 1 + (risk - 0.8)/0.2; //scale between 1 and 2
	}
	else if( risk <= 1.2 ){
		//class = "red";
		return 2 + (risk - 1.0)/0.2; //scale between 2 and 3
	}
	else{
		//class = "darkred";
		return 3 + (risk - 1.2); //scale 3 and beyond		
	}
}

// Are we still using these? (do they need translation)
function neutralTips() {
	let tips = [ "Enjoy your activity",
				"Looks like it's all good",
				"An apple a day keeps the doctor at bay",
				"French minister names his cat 'Brexit' because: &quot;she meows loudly it wants to go out, but just stands there waiting when I open the door&quot;",
				"Two atoms walk into a bar, one says: &quot;I just lost an electron&quot, the other replies: &quot;are you sure?&quot; ... &quot;yes, i'm positive!&quot",
				"It doesn't matter what temperature the room is, it's always room temperature.",
				"If you cannot measure it, you cannot improve it - Lord Kelvin",
	];
	let i = Math.floor( Math.random() * tips.length );
	return tips[i];
}

function heatLevelTips( index, level, kb, pageID, translations, language){
	console.log( "heatLevelTips");
    return new Promise((resolve, reject) => {
		var mode = "heat";
		var pav = getPAL( kb, mode);
		var data = {
			"mode": mode,
			"level": level,
			"wbgt": kb.thermalindices.phs[index].wbgt,
			"tair": kb.thermalindices.phs[index].Tair,
			"rh": kb.thermalindices.phs[index].rh,
			"pal": getPAL( kb, mode),
			"watt": M( kb ) * BSA( kb ), //Watts
			"covered": isClothingCovering(kb),
			"caf": getCAF(kb),
			"ral": RAL(kb),
			"d_tre": kb.thermalindices.phs[ index].D_Tre,
			"d_sw": kb.thermalindices.phs[ index].Dwl50,
			"sw_tot_g": kb.thermalindices.phs[ index].SWtotg,
			"lang": language, // locale
		};
		var url = "https://www.sensationmapps.com/WBGT/api/thermaladvisor.php";
		console.log("getting riskval : ");
		
		var riskval = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, true );
		console.log("riskval : "+ riskval);
		
		var risklabel = gaugeTitleHeat( riskval, translations, language);
		console.log("risklabel : "+ risklabel);
		
		$.get( url, data).done( function(data, status, xhr){
			if(status === "success") {
				
				var header = pageID === "dashboard" ? "<p class='label'><i id='circle_gauge_color' class='fas fa-circle'></i>" + risklabel + "</p>" : ""; 
				var str = header; // circle with gauge color
				let tips = JSON.parse(data);
				console.log(JSON.stringify(tips));
				tips.tips.forEach(function(tip){
					str += "<p>"+tip+"</p>";
				});
				tips.personal.forEach(function(tip){
					str += "<p>"+tip+"</p>";
				});
                console.log("Fetched tips.");
				resolve(str); 
			} else {
                console.log("Could not get tips from server.");
				reject(false); 
			}
		});
	});
}

function indoorTips( kb, translations, language){
	let str = "";

	let pps = 100.0 - kb.thermalindices.pmv[ 0 ].PPD;
	
	str += "<p>"+pps.toFixed(0)+"% is satisfied with this indoor environment.</p>";
	return str;
}

function coldLevelTips( index, level, kb, cold_index, pageID, translations, language){
	let str = "";
	
	let icl_min = kb.thermalindices.ireq[ index ].ICLminimal;
	
	let windchill = kb.thermalindices.ireq[index].windchill;
    let tair = kb.thermalindices.ireq[index].Tair;
	let threshold = kb.thresholds.windchill.deltaT;
	
	let windrisk = windchillRisk( windchill );
	let isWindstopperUseful = ( tair - threshold ) > windchill;
	pageID === "dashboard" ? str += "<p class='label'><i id='circle_gauge_color' class='fas fa-circle'></i>" + gaugeTitleCold(cold_index, translations, language) + "</p>" : str += "";
		
	if( level === 1 ){ //beginner, early user
		if( cold_index <= 1 ){
			str += "<p>" + translations.sentences.dash_tip_green[language] + "</p>";
		}
		else if( cold_index <= 2 ){
			str += "<p>" + translations.sentences.dash_tip_cyan[language] + "</p>";
		}
		else if( cold_index <= 3 ){
			str += "<p>" + translations.sentences.dash_tip_blue[language] + "</p>";
			if( windrisk ){
				str += "<p>" + translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.dash_tip_windchill_3[language] + "</p>";
			}
		}
		else if( cold_index > 3){
			str += "<p>" + translations.sentences.dash_tip_severe_cold[language] + "</p>";
			if( windrisk ){
				str += "<p>" + translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.sentences.dash_tip_windchill_3[language] + "</p>";
			}
		}
	}
	else if( level === 2 ){ //experienced user // or more info requested
		if( cold_index <= 1 ){
			str += "<p>" + translations.sentences.dash_tip_general_1[language] + "</p>";
			str += "<p>" + translations.sentences.dash_tip_general_2[language] + "</p>";
			str += "<p>" + translations.sentences.dash_tip_general_3[language] + "</p>";
		}
		else if( cold_index <= 2 && isWindstopperUseful ){
			str += "<p>" + translations.sentences.dash_tip_normal[language] + "</p>";
			str += "<p>" + translations.sentences.dash_tip_windchill_significant_1[language] + " " + windchill.toFixed(0) + "&deg;, " + translations.sentences.dash_tip_windchill_significant_2[language] + "</p>";
		}
		else if( cold_index <= 2 ){
			str += "<p>" + translations.sentences.dash_tip_increase_insulation[language] + "</p>";
		}
		else if( cold_index > 2 ){
			str += "<p>" + translations.sentences.dash_tip_extra_attention[language] + "</p>";
			if( isWindstopperUseful ){
				str += "<p>" + translations.sentences.dash_tip_windchill_significant_1[language] + " " + windchill.toFixed(0) + "&deg;, " + translations.sentences.dash_tip_windchill_significant_2[language] + "</p>";
			}
			if( windrisk ){
				str += "<p>" + translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.sentences.dash_tip_windchill_3[language] + "</p>";
			}
		}
	}
	return str;
}

// Returning rgba value of current gauge value as string
function getCurrentGaugeColor(value) {
	if(value > -4.0 && value <= -3.0) {
		return 'rgba(0,0,180,.9)';
	} else if(value > -3.0 && value <= -2.0) {
		return 'rgba(0,100,255,.9)';
	} else if(value > -2.0 && value <= -1.0){
		return 'rgba(0,180,180,.9)';
	} else if(value > -1.0 && value <= 1.0) {
		return 'rgba(0,180,0,.9)';
	} else if(value > 1.0 && value <= 2.0) {
		return 'rgba(220,220,0,.9)';
	} else if(value > 2.0 && value <= 3.0) {
		return 'rgba(255,165,0,.9)';
	} else if(value > 3.0 && value <= 4.0) {
		return 'rgba(150,0,0,.9)';
	} else {
		throw new Error("Value not in expected range [-4;4]: " + value); // error
	}
}

/* Recursively merge properties of two objects (left join) */
function MergeRecursive(obj1, obj2) {

	for (var p in obj2) {
	  try {
		// Property in destination object set earlier; update its value.
		if ( obj2[p].constructor==Object ) {
		  obj1[p] = MergeRecursive(obj1[p], obj2[p]);  
		} else {
		  obj1[p] = obj2[p];
		}  
	  } catch(e) {
		// Property in destination object not set; create it and set its value.
		obj1[p] = obj2[p];
	  }
	}  
	return obj1;
}

function customLocationEnabled(kb) {
	return kb.user.guards.customLocationEnabled && locationSetCorrectly(kb);
}

function getLocation(kb) {
	var lat, lon;
	// Get weather data from correct location
	if(customLocationEnabled(kb)) {
		lat = kb.user.settings.coordinates_lat;
		lon = kb.user.settings.coordinates_lon;
	} else {
		lat = kb.position.lat;
		lon = kb.position.lng;
	}
	return [lat, lon];
}

// Returns true if coordinates have been saved or position is fetched from api
function locationSetCorrectly(kb) {
	// Both coordinates are numbers, and within ranges lat: 0-90, lon: 0-180
	return coordsIsWithinRange(kb.user.settings.coordinates_lat, kb.user.settings.coordinates_lon);
}

function coordsIsWithinRange(lat, lon) {
	return (typeof lat === 'number' && typeof lon === 'number') 
	&& (lat > 0 && lat <= 90)
	&& (lon > 0 && lon <= 180)
}

/* The introduction elements follows order of JSON array */
function startIntro(translations, language) {
	var intro = introJs();
          intro.setOptions({
            steps: [
              {
                element: '#nav',
				intro: "<p><b>" + translations.sentences.intro_nav_1[language]  + "</b></p>" +
				"<p>" + translations.sentences.intro_nav_2[language] + ".</p>" + 
				"<p>" + translations.sentences.intro_nav_3[language] + ".</p>",
				position: "left"
			  },
			  {
                element: '#gauge_div',
				intro: "<p>" + translations.sentences.intro_gauge[language] + ".</p>" /*+ 
						"<p>The positive values indicate the level of heat stress and the negative values the level of cold stress.</p>"*/
			  },
			  {
                element: '#dashboard_numbers',
				intro: translations.sentences.intro_range[language] + ".",
				position: 'bottom'
              },
			  {
                element: '#dashboard_forecast',
				intro: translations.sentences.intro_forecast_1[language] + ".</p>" + 
						"<p>" + translations.sentences.intro_forecast_2[language] + ".",
				position: 'bottom'
              },
              {
                element: '#tips',
				intro: "<p>" + translations.sentences.intro_tips[language] + ".",
                position: 'bottom'
              },
              {
                element: '#tip_detailed',
				intro: "<p>" + translations.sentences.intro_details_1[language] + ".</p>" + 
						"<p>" + translations.sentences.intro_details_2[language] + ".</p>",
                position: 'bottom'
              },
              {
                element: '#menu_flex',
				intro: "<p>" + translations.sentences.intro_wheels_1[language] + ".</p>" +
				"<p>" + translations.sentences.intro_wheels_2[language] + ".</p>",
                position: 'middle'
              }
            ]
          });
          intro.start();
}

function firstCharToUpper(word){
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function getAgeFromYearOfBirth(yob) {
	return new Date().getFullYear() - yob;
}
