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
	let values = { "Summer_attire": 0.38, 
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
	if( kb.settings.acclimatization ){
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

	let clokey = kb.clothing.selected;
	let helmetkey = kb.headgear.selected;
	return ( clothingvalues[clokey] + headvalues[helmetkey] );
}

function getWBGTeffective(wbgt, kb){
	let caf = getCAF(kb);
	return 1.0 * wbgt + caf;
}

function WBGTrisk(wbgt, kb) {
    let RAL_ = RAL(kb);
	
	let wbgt_effective = getWBGTeffective(wbgt, kb);
	let risk = wbgt_effective / RAL_; 
	
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
		return 3 + (risk - 1.2); //scale between 2 and 3		
	}
}

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

function heatLevelTips( index, level, kb ){
	
    return new Promise((resolve, reject) => {
		var data = {
			"wbgt": kb.thermalindices.phs[index].wbgt, // this does not take diff into account when fetching information?
			"ral": RAL(kb),
			"caf": getCAF(kb),
			"d_tre": kb.thermalindices.phs[ index].Dtre,
			"d_sw": kb.thermalindices.phs[ index].Dwl50,
			"sw_tot_g": kb.thermalindices.phs[ index].SWtotg	
		};
		var url = "http://www.sensationmapps.com/WBGT/api/thermaladvisor.php";
		$.get( url, data).done( function(data, status, xhr){
			if(status === "success") {
				var str = "<p class='label'><i id='circle_gauge_color' class='fas fa-circle'></i> Advice</p>"; // circle with gauge color
				let tips = JSON.parse(data);
				$.each( tips, function(k, tip ){
					str += "<p>"+tip+"</p>";
				} );
                console.log("Fetched tips");
				resolve(str); 
			} else {
                console.log("Could not get tips from server.");
				reject(false); 
			}
		});
	});
}

function coldLevelTips( index, level, kb ){
	let str = "";
	
	let icl_min = kb.thermalindices.ireq[ index ].ICLminimal;
	let cold_index = icl_min;
	
	let windchill = kb.thermalindices.ireq[index].windchill;
    let tair = kb.thermalindices.ireq[index].Tair;
	let threshold = kb.thresholds.windchill.deltaT;
	
	let windrisk = windchillRisk( windchill );
	
	let isWindstopperUseful = ( tair - threshold ) > windchill;
		
	if( level === 1 ){ //beginner, early usre
		str += "<p> <i id='circle_gauge_color' class='fas fa-circle'></i>" // circle with gauge color
		if( cold_index <= 1 ){
			str += "The green level means that low thermal stress is forecasted.</p>";
		}
		else if( cold_index <= 2 ){
			str += "The cyan level means that moderate cold stress is expected.</p>";
		}
		else if( cold_index <= 3 ){
			str += "The blue level means that high cold stress is expected.</p>";
			if( windrisk ){
				str += "Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.</p>";
			}
		}
		else if( cold_index > 3){
			str += "This level is associated with severe cold stress.</p>";
			if( windrisk ){
				str += "Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.</p>";
			}
		}
	}
	else if( level === 2 ){ //experienced user // or more info requested
		if( cold_index <= 1 ){
			str += "The personalized cold stress indicator depends on the weather report as well as your personal input.</p>";
			str += "The score will increase towards higher warning levels if the weather agravates, your activity level decreases or your clothing level decreases.</p>";
			str += "No special precautions are required unless you work/excercise in special settings (indoor) or with resticted ability to maintain heat.</p>";
		}
		else if( cold_index <= 2 && isWindstopperUseful ){
			str += "You should be able to maintain normal activities - but appropriate/adjusted behavior is required.</p>";
			str += "There is significant windchill " + windchill.toFixed(0) + "&deg;, you should consider clothing with high wind stopping properties.</p>";
		}
		else if( cold_index <= 2 ){
			str += "You should consider to increase insulation from clothing by adding layers or choosing warmer/thicker clothing.</p>";
		}
		else if( cold_index > 2 ){
			str += "At this level you are recommended to pay extra attention to appropriate behavior and match clothing to the cold level and protect exposed skin. Be aware not to overdress, because sweating will cool you down.</p>";
			if( isWindstopperUseful ){
				str += "There is significant windchill " + windchill.toFixed(0) + "&deg;, you should consider clothing with high wind stopping properties.</p>";
			}
			if( windrisk ){
				str += "Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.</p>";
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
		return 'rgba(255,100,0,.9)';
	} else if(value > 3.0 && value <= 4.0) {
		return 'rgba(180,0,0,.9)';
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

/* The introduction elements follows order of JSON array */
function startIntro() {
	var intro = introJs();
          intro.setOptions({
            steps: [
              {
                element: '#nav',
				intro: "<p><b>Dashboard introduction</b></p>" +
				"<p>To familiarize you with the app, we will introduce the different elements on the dashboard.</p>" + 
				"<p>From the navigation bar you can switch between the Dashboard and Settings screens.</p>",
				position: "left"
			  },
			  
			  {
                element: '#gauge_div',
				intro: "<p>The gauge indicates the expected level of heat or cold stress on a scale from -4 to 4.</p>" /*+ 
						"<p>The positive values indicate the level of heat stress and the negative values the level of cold stress.</p>"*/
			  },
			  {
                element: '#dashboard_numbers',
				intro: "This area provides basic information about the current weather.",
				position: 'bottom'
              },
			  {
                element: '#dashboard_forecast',
				intro: "This bar allows for swiping between the forecasted weather data of today to see how the weather is predicted to change during the day.</p>" + 
						"<p>The data is given in 3 hour intervals.",
				position: 'bottom'
              },
              {
                element: '#tips',
				intro: "<p>This area describes how to cope with the current weather.",
                position: 'bottom'
              },
              {
                element: '#tip_detailed',
				intro: "<p>This area gives you additional details and advice on how to cope with the current climatic situation.</p>" + 
						"<p>Press <i>more info</i> to read more.</p>",
                position: 'bottom'
              },
              {
                element: '#menu_flex',
				intro: "<p>Here you can set your estimated activity level, clothing level and head gear.</p>" +
				"<p>You can read more about the different levels in the description below.</p>",
                position: 'middle'
              }
            ]
          });
          intro.start();
}

module.exports = {gaugeTitleCold, gaugeTitleHeat, getTemperatureUnit, getTemperatureValueInPreferredUnit, windchillRisk, BSA, M, RAL, WBGTrisk, neutralTips, heatLevelTips,coldLevelTips, getCurrentGaugeColor, startIntro, MergeRecursive, checkUserExistInDB};
