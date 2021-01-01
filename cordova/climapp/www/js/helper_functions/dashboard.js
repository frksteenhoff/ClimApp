/* Function related to the dashboard */

function gaugeTitleCold(val, translations, language) {
	var labels = translations.labels;
	if ( val <= -1 ) return labels.str_possible_heat_stress[language];
    else if ( val <= 1 ) return labels.str_no_stress[language];
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
		return Math.round( 10*( temp * 9/5 + 32) )/10;
	} else {
		return Math.round( 10*( temp ) )/10;
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
function BSA(kb){ //m2
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let w = kb.user.settings.weight; //kg
        let h = kb.user.settings.height / 100; //m
        return ( Math.pow(h, 0.725) * 0.20247 * Math.pow(w, 0.425 ) );//dubois & dubois 
    }
}

function M(kb) { //W/m2
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let ISO_selected = kb.user.settings.activity_selected;
		var watt = kb.activity.values[ ISO_selected ].val;
		var m2 = BSA(kb);
		//console.log( "M:" + watt/m2);
		return watt / m2;
    }
}

function getClo(kb){
	return kb.user.settings.insulation_selected;
}
function getAirPermeability(kb){
	return kb.user.settings.windpermeability_selected;
}

function getMoisturePermeability(kb){
	return kb.user.settings.vapourpermeability_selected;
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
	/*
	let clothingvalues = { "Summer_attire": -3, 
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
	*/
	let icl = getClo( kb );
	let icl_norm = 0.6;//ISO clothing base
	let icl_max = 2.0; //winter full
	let d_icl = icl_max - icl_norm;
	let dCav_icl = 3.0;//double layer cav
	let CAV_icl = dCav_icl * ( icl - icl_norm ) / d_icl;
	
	
	let im = getMoisturePermeability( kb );
	let im_min = 0.1;
	let im_norm = 0.38;
	let d_im = im_norm - im_min;
	let dCav_im = 10.0;
	let CAV_im = dCav_im * (im_norm - im ) / d_im; 
	return CAV_im + CAV_icl;
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
	return 0;//kb.user.adaptation[thermal].diff.length > 0 ? kb.user.adaptation[thermal].diff[0] : 0;
}

		   
function WBGTrisk(wbgt, kb, isPersonalised ) {
	let RAL_ = RAL(kb);
	let wbgt_effective = getWBGTeffective(wbgt, kb);
	let RAL_effective = (RAL_);
	let risk = wbgt_effective / RAL_effective;  
	
	if( risk <= 0.8 ){
		//class = "green";
		return risk / 0.8; //scale to max 1
	}
	else if( risk <= 1.0 ){
		//class = "yellow";
		return 1 + (risk - 0.8)/0.2; //scale between 1 and 2
	}
	else if( risk <= 1.2 ){
		//class = "orange";
		return 2 + (risk - 1.0)/0.2; //scale between 2 and 3
	}
	else{
		//class = "red";
		return 3 + (risk - 1.2); //scale 3 and beyond		
	}
}

function heatLevelTips( index, level, kb, pageID, translations, language){
    return new Promise((resolve, reject) => {
		var mode = "heat";
		var data = {
			"mode": mode,
			"level": level,
			"wbgt": kb.thermalindices.phs[index].wbgt,
			"tair": kb.thermalindices.phs[index].Tair,
			"rh": kb.thermalindices.phs[index].rh,
			"pal": 0,
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
		var riskval = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, true );		
		var risklabel = gaugeTitleHeat( riskval, translations, language);
		//console.log( "retrieving heat level tips: " + JSON.stringify( data ) );
		$.get( url, data).done( function(data, status, xhr){
			if(status === "success") {
				
				var header = pageID === "dashboard" ? "<p class='label'><i id='circle_gauge_color' class='fas fa-circle'></i>" + risklabel + "</p>" : ""; 
				var str = header; // circle with gauge color
				let tips = JSON.parse(data);
				console.log(JSON.stringify(tips));
				tips.labels.forEach(function(key){
					str += "<p class='thermaltip'>" + translations.sentences[key][language] +"</p>";
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
	str += "<p>"+pps.toFixed(0) + translations.sentences.indoor_tips_ppd[language] +"</p>";
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
	pageID === "dashboard" ? str += "<p class='label'><i id='circle_gauge_color' class='fas fa-dot-circle'></i>" + gaugeTitleCold(cold_index, translations, language) + "</p>" : str += "";
	
	var tips = [];
	if( level === 1 ){ //beginner, early user
		if( cold_index <= -1 ){
			tips.push( translations.sentences.dash_tip_overdressed[language] );
		}
		else if( cold_index <= 1 ){
			tips.push( translations.sentences.dash_tip_green[language] );
		}
		else if( cold_index <= 2 ){
			tips.push( translations.sentences.dash_tip_cyan[language] );
		}
		else if( cold_index <= 3 ){
			tips.push( translations.sentences.dash_tip_blue[language] );
			if( windrisk ){
				tips.push( translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.dash_tip_windchill_3[language] );
			}
		}
		else if( cold_index > 3){
			tips.push( translations.sentences.dash_tip_severe_cold[language] );
			if( windrisk ){
				tips.push( translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.sentences.dash_tip_windchill_3[language] );
			}
		}
	}
	else if( level === 2 ){ //experienced user // or more info requested
		if( cold_index <= -1 ){
			tips.push( translations.sentences.dash_tip_overdressed[language] );
		}
		else if( cold_index <= 1 ){
			tips.push( translations.sentences.dash_tip_general_1[language] );
			tips.push( translations.sentences.dash_tip_general_2[language] );
			//tips.push( translations.sentences.dash_tip_general_3[language];
		}
		else if( cold_index <= 2 ){
			tips.push( translations.sentences.dash_tip_increase_insulation[language] );
		}
		else if( cold_index > 2 ){
			tips.push( translations.sentences.dash_tip_extra_attention[language] );
			
		}
		
		if( isWindstopperUseful ){
			tips.push( translations.sentences.dash_tip_windchill_significant_1[language] + " " + windchill.toFixed(0) + "&deg;, " + translations.sentences.dash_tip_windchill_significant_2[language] );
		}
		if( windrisk ){
			tips.push( translations.sentences.dash_tip_windchill_1[language] + " " + windchill.toFixed(0) + "&deg; " + translations.sentences.dash_tip_windchill_2[language] + " " + windrisk + " " + translations.sentences.dash_tip_windchill_3[language] );
		}
	}
	
	$.each( tips, function(key, sentence ){
		str += "<p class='thermaltip'>"+sentence+"</p>";
	});
	return str;
}

// Returning rgba value of current gauge value as string
function getCurrentGaugeColor(value) {
	if(value >= -4.0 && value <= -3.0) {
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
	// Both coordinates are numbers, and within ranges lat: -90-90, lon: -180 - 180
	return coordsIsWithinRange(kb.user.settings.coordinates_lat, kb.user.settings.coordinates_lon);
}

function coordsIsWithinRange(lat, lon) {
	return (typeof lat === 'number' && typeof lon === 'number') 
	&& (lat > -89 && lat <= 89)
	&& (lon > -180 && lon <= 180)
}

/* The introduction elements follows order of JSON array */
function startIntro(translations, language) {
	var intro = introJs();
          intro.setOptions({
            steps: [
			  {
				  element: '#main_panel',
				  intro: "<p>" + translations.sentences.intro_nav_1[language]  + "</p>", //to familiarize
			  },
			  {
	              element: '#dashboard_numbers',
				  intro: "<p>" + translations.sentences.intro_range[language] + "</p>",
			  },
	          {
	              element: '#climapp_report',
				  intro: "<p>" + translations.sentences.intro_climapp_index[language] + "</p>",
			  },
	          {
	              element: '#customisationpanel',
				  intro: "<p>" + translations.sentences.intro_wheels_1[language] + "</p>" +
				         "<p>" + translations.sentences.intro_wheels_2[language] + "</p>",
	          },
			  {
	            element: '#forecast_panel',
				intro: "<p>" + translations.sentences.intro_gauge[language] + "</p>",
			  },
	          {
	            element: '#details_panel',
				intro: "<p>" + translations.sentences.intro_details_1[language] + "</p>",
	          },
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
