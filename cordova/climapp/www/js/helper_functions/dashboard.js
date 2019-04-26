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
function BSA(kb) {
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let w = kb.settings.weight.value; //kg
        let h = kb.settings.height.value / 100; //m
        return ( Math.pow(h, 0.725) * 0.20247 * Math.pow(w, 0.425 ) );//dubois & dubois 
    }
}

function M(kb) {
    if(typeof(kb) !== 'undefined'){ // Making sure only valid kb instances are being accessed.
        let ISO_selected = kb.activity.selected;
        let ISO_level = kb.activity.values[ ISO_selected ];
        return 50 * (ISO_level);
    }
}

function RAL(kb) {
    let M_ = M(kb); //W/m2
    let BSA_ = BSA(kb); //m2
    let watt = M_ * BSA_;
    return 59.9 - 14.1 * Math.log10( watt );
}

function WBGTrisk(wbgt, kb) {
    let RAL_ = RAL(kb);
    let risk = wbgt / RAL_; 
    if (risk >= 1.2 ){
        return 3 * ( risk / 1.2 );
    } else if (risk > 1.0 ){
        return 2 * ( risk );
    } else if (risk <= 1.0 ){
        return ( risk / 0.8); // scale 0.8 to 1
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
	let str = "";
	
	let heat_index = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb );
	
    let d_sw = kb.thermalindices.phs[ index].Dwl50;
    let sw_tot_per_hour = 0.001 * 60 * kb.thermalindices.phs[ index].SWtotg / 
    (kb.sim.duration ); //liter per hour
    sw_tot_per_hour = sw_tot_per_hour.toFixed(1);

	
	if( level === 1 ){ //beginner, early usre
		if( heat_index <= 1 ){
			str += "<p>The green level means that low thermal stress is forecasted.</p>";
		}
		else if( heat_index <= 2 ){
			str += "<p>The yellow level means that moderate heat stress is expected.</p>";
			
		}
		else if( heat_index <= 3 ){
			str += "<p>The red level means that high heat stress is expected.</p>";
		}
		else if( heat_index > 3){
			str += "<p>This level is associated with severe heat stress.</p>";
		}
	}
	else if( level === 2 ){ //experienced user // or more info requested
		if ( heat_index <= 1){
			str += "<p>The personalized heat stress indicator depends on the weather report as well as your personal input</p>";
			str += "<p>The score will increase towards higher warning levels if the weather agravates, your activity level increases or your clothing level increases.</p>";
			str += "<p>No special precautions are required unless you work/excercise in special settings (indoor) or with resticted ability to release heat.</p>";
		}
		else if( heat_index <= 2 ){
			str += "<p>You should be able to maintain normal activities. You may experience higher thermal strain and more sweating than normal.</p>";
			str += "<p>Consider clothing adjustments and drink more than normal; especially when the score approaches the red heat stress level.</p>";
			
		}
		else if( heat_index <= 3 ){
			str += "<p>Pay special attention to drinking sufficient during the first days with this heat stress.</p>";
			str += "<p>Consider adjusting activities (heavy physical tasks during periods of the day with lowest heat) and allow time to adapt.</p>";
			str += "<p>Be aware that thirst is usually not a sufficient indicator when losses are high.</p>";
			str += "<p>Remember to drink/rehydrate with your meals.</p>";
		}
		else if( heat_index > 3){
			str += "<p>This level is associated with severe heat stress</p>";
			str += "<p>Your estimated sweat rate surpasses "+ sw_tot_per_hour+" Liter per hour, so additional drinking is required.</p>";
			str += "<p>The heat will impact your physical performance - adjusting activities and allowing sufficient breaks will benefit your overall daily ability to cope with the heat.</p>";
		}
	}
	return str;
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
		if( cold_index <= 1 ){
			str += "<p>The green level means that low thermal stress is forecasted.</p>";
			str += "<p>The score will increase towards higher warning levels if the weather agravates, your activity level decreases or your clothing level decreases.</p>";
		}
		else if( cold_index <= 2 ){
			str += "<p>The cyan level means that moderate cold stress is expected.</p>";
			str += "<p>You should be able to maintain normal activities - but appropriate/adjusted behavior is required.</p>";
		}
		else if( cold_index <= 3 ){
			str += "<p>The blue level means that high cold stress is expected.</p>";
			if( windrisk ){
				str += "<p>Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.</p>";
			}
		}
		else if( cold_index > 3){
			str += "<p>This level is associated with severe cold stress.</p>";
			if( windrisk ){
				str += "<p>Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.</p>";
			}
		}
	}
	else if( level === 2 ){ //experienced user // or more info requested
		if( cold_index <= 1 ){
			str += "<p>The personalized cold stress indicator depends on the weather report as well as your personal input.</p>";
			str += "<p>No special precautions are required unless you work/excercise in special settings (indoor) or with resticted ability to maintain heat.</p>";
		}
		else if( cold_index <= 2 && isWindstopperUseful ){
			str += "There is significant windchill " + windchill.toFixed(0) + "&deg;, you should consider clothing with high wind stopping properties.";
		}
		else if( cold_index <= 2 ){
			str += "You should consider to increase insulation from clothing by adding layers or choosing warmer/thicker clothing.";
		}
		else if( cold_index > 2 ){
			str += "<p>At this level you are recommended to pay extra attention to appropriate behavior and match clothing to the cold level and protect exposed skin. Be aware not to overdress, because sweating will cool you down.</p>";
			if( isWindstopperUseful ){
				str += "There is significant windchill " + windchill.toFixed(0) + "&deg;, you should consider clothing with high wind stopping properties.";
			}
			if( windrisk ){
				str += "Due to the windchill " + windchill.toFixed(0) + "&deg; there is a risk for exposed skin to freeze in " + windrisk + " minutes.";
			}
		}
	}
	return str;
}

