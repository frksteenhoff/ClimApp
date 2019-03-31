/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
	knowledgeBase: undefined,
	pageMap: undefined,
	currentPageID: undefined,
	selectedWeatherID: undefined,
	radialgauge: undefined,
	
	
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		//this.onDeviceReady(); //call this to run on browser, as browser does not fire the event by itself.
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
		window.onerror = function(message, url, lineNumber) {
		        console.log("Error: "+message+" in "+url+" at line "+lineNumber);
		    }
        this.receivedEvent('deviceready');
		
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		this.loadSettings();
		localStorage.clear();
		if( this.knowledgeBase.user_info.firstLogin ){//onboarding
			this.loadUI( "onboarding" );
		}
		else{
			this.loadUI( "dashboard" );
		}
		this.updateLocation();
    },
	initNavbarListeners: function(){
		// navigation menu
		var self = this;
		$("div[data-listener='navbar']").off();
		$("div[data-listener='navbar']").on("click", function(){
			let target = $( this ).attr("data-target");
			self.knowledgeBase.user_info.firstLogin = false;
			self.loadUI( target );
		});
	},
	initFeedbackListeners: function() {
		var self = this;
		// When user rates the feedback questions
		$("input[data-listener='feedback']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='feedback']").on("click", function(){
			var target = $(this).attr("data-target");
			
			// Updating rating bar using first char in ID
			var rating_id = $(this).attr("id")[0];
			
			if(rating_id === '1') {
				self.knowledgeBase.feedback.question1.rating = target;
				$("#ratingtext1").html( self.knowledgeBase.feedback.question1.ratingtext[self.knowledgeBase.feedback.question1.rating] );
			} else if(rating_id === '2') {
				self.knowledgeBase.feedback.question2.rating = target;
				$("#ratingtext2").html( self.knowledgeBase.feedback.question2.ratingtext[self.knowledgeBase.feedback.question2.rating] );
			} else {
				self.knowledgeBase.feedback.question3.rating = target;
				$("#ratingtext3").html( self.knowledgeBase.feedback.question3.ratingtext[self.knowledgeBase.feedback.question3.rating] );
			}
			$( "input[data-listener='feedback']" ).removeClass( "checked" );
		});
		
		// When user submits feedback, add to object to send to db + reset values
		$("button[data-listener='submit']").off();
		$("button[data-listener='submit']").on("click", function(){
			var target = $("#feedback_text").val();
			self.knowledgeBase.feedback.comment = target;
			
			// If user not in database, add user to database
			if(!self.knowledgeBase.user_info.hasExternalDBRecord) {
				self.createUserRecord();
				self.knowledgeBase.user_info.hasExternalDBRecord = true;
			} 
			// Add feedback to database
			self.addFeedbackToDB();
						
			// reset values
			$('#feedback_text').val("");

			// Load settings page
			self.loadUI('settings');
		});
	},
	initSettingsListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			let title_ = self.knowledgeBase.settings[target].title;
			var items_ = self.getSelectables( target );
			
			
			var config = {
			    title: title_,
			    items:[ [ items_ ] ],
			    positiveButtonText: "Done",
			    negativeButtonText: "Cancel"
			};
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.settings[target].value = items_[result[0].index].value;
				self.saveSettings();
				if(["age", "gender", "height", "weight"].includes(target)) {
					self.updateDBParam(target);
				}
				console.log( target + ": " + items_[result[0].index].value);
				self.saveSettings(); 
				self.updateUI();
			}, function() {
			    console.log('Canceled');
			});
		});		

		$("input[data-listener='notification_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='notification_switch']").on("click", function(){
			var isChecked = $(this).is(":checked");
			self.knowledgeBase.user_info.receivesNotifications = isChecked;

			// Inform user about choice in toast
			var notificationText = isChecked ? "You are receiving notifications!" : "You will not receive notifications.";
			self.showShortToast(notificationText);
		});

		$("div[data-listener='feedback_page']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='feedback_page']").on("touchstart", function(){
			self.loadUI('feedback');
		});

		$("div[data-listener='disclaimer_page']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='disclaimer_page']").on("touchstart", function(){
			self.loadUI('disclaimer');
		});

		$("div[data-listener='about_page']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='about_page']").on("touchstart", function(){
			self.loadUI('about');
		});

		$("div[data-listener='reset_preferences']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='reset_preferences']").on("touchstart", function(){
			// Resetting values to default
			self.knowledgeBase.settings.age.value = 30;
			self.knowledgeBase.settings.gender.value = "undefined";
			self.knowledgeBase.settings.height.value = 178;
			self.knowledgeBase.settings.weight.value = 82;
			self.knowledgeBase.settings.unit.value = "SI";
			self.knowledgeBase.user_info.firstLogin = true;

			// Inform user about event in toast
			var notificationText = "Personal preferences reset, using default values.";
			self.showShortToast(notificationText);
		});
	},
	initGeolocationListeners: function(){
		var self = this;
		$("div[data-listener='geolocation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='geolocation']").on("touchstart", function(){
			self.updateLocation();
		});		
	},
	initForecastListeners: function(){
		var self = this;
		$("div[data-listener='forecast']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='forecast']").on("click", function(){
			$("div[data-listener='forecast']").removeClass("focus");
			$(this).addClass("focus");
			let windowsize = $(window).width();
			
			let index = $(this).attr("data-index");
			
			self.updateInfo( index );
			
			var offset_scroll = ( $(this).offset().left - ( 0.5*windowsize) + 0.075*windowsize) -
								$("forecasts").scrollLeft(); //CENTERING
			$("#forecasts").animate({
				scrollLeft: offset_scroll
			}, 1000);
			
		});		
	},
	initActivityListeners: function(){
		var self = this;
		$("div[data-listener='activity']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='activity']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			self.knowledgeBase.activity.selected = target;
			
			$( "div[data-listener='activity']" ).removeClass( "selected" );
			self.calcThermalIndices();
			self.updateUI();
		});	
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "./pages/dashboard.html",
						 "settings": "./pages/settings.html",
						 "feedback": "./pages/feedback.html",
		 				 "onboarding": "./pages/onboarding.html",
		 				 "disclaimer": "./pages/disclaimer.html",
						 "details": "./pages/details.html",
		 				 "about": "./pages/about.html"};
		
		localStorage.clear();
		if ( localStorage.getItem("knowledgebase") !== null ) {
			this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase") );
		}
		else{
			var self = this;
			this.knowledgeBase = {  "position": { "lat": 0, 
												 "lng": 0, 
												 "timestamp": "" },
								   "weather": {	"station": "",
												"lat": 0,
												"lng": 0,
											    "distance": -1,
												"utc": [""],
												"wbgt": [-99],
												"windchill": [-99],
			 									"temperature": [-99],
												"globetemperature": [-99],
											    "humidity": [-99],
												"watervapourpressure": [-99],
												"windspeed": [-99],
												"radiation": [-99],
												"temperature_unit": function() { return self.knowledgeBase.settings.unit.value === "US" ? "Fahrenheit" : "Celcius"; }
									},
								  "settings": { "age": {"title": "What is your age?",
														"value": 36,
														"unit": function(){
															return "years";
														}
												 },
												 "height": {"title": "What is your height?",
															"value": 186,
															"calculated_value": function() {
																let unit = self.knowledgeBase.settings.unit.value;
																if(unit != "SI") { // feet, inches
																	return Math.round(self.knowledgeBase.settings.height.value / 30.48); 
																} else { // cm
																	return self.knowledgeBase.settings.height.value;
																}
															},
															"unit": function() {
																return self.knowledgeBase.settings.unit.value === "SI" ? "cm" : "feet";
															}},
												 "weight": {"title": "What is your weight?",
															"value": 82,
															"calculated_value": function() {
																let unit = self.knowledgeBase.settings.unit.value;
																switch(unit) {
																	case "US": // pounds
																		 return Math.round(self.knowledgeBase.settings.weight.value * 2.2046);
																	case "UK": // stones
																		return Math.round(self.knowledgeBase.settings.weight.value * 0.1574);
																	default:
																		return self.knowledgeBase.settings.weight.value;
																}
															},
															"unit": function() {
																if(self.knowledgeBase.settings.unit.value === "SI") {
																	return "kg";
																} else if(self.knowledgeBase.settings.unit.value === "US") {
																	return "lbs"
																} else {
																	return "stones"
																}
															}},
												 "gender": {"title": "What is your gender?",
															"value": "Male"},
												 "BSA": function(){ //m2
													 let w = self.knowledgeBase.settings.weight.value; //kg
													 let h = self.knowledgeBase.settings.height.value / 100; //m
													 return ( Math.pow(h, 0.725) * 0.20247 * Math.pow(w, 0.425 ) );//dubois & dubois 
												 },
												 "M": function(){ //W/m2
													 let ISO_selected = self.knowledgeBase.activity.selected;
												 	 let ISO_level = self.knowledgeBase.activity.values[ ISO_selected ];
													 return 50 * (ISO_level);
												 },
												 "unit": { "value": "SI" } // default SI units
								   },
								  "activity": { "label": {	"rest": "Resting, sitting at ease.\nBreathing not challenged.",
													 		"low":"Light manual work:\nwriting, typing, drawing, book-keeping.\nEasy to breathe and carry on a conversation.",
													 		"medium":"Walking 2.5 - 5.5km/h. Sustained arm and hand work: handling moderately heavy machinery, weeding, picking fruits.",
														 	"high":"Intense arm and trunk work: carrying heavy material, shovelling, sawing, hand mowing, concrete block laying.",
															"intense":"Very intense activity at fast maximum pace:\nworking with an ax, climbing stairs, running on level surface." 
												},
												"values": { "rest": 1, //ISO 8896
															"low": 2,
															"medium": 3,
															"high": 4,
															"intense": 5
												},	
												"selected": "low",	
											},
									"feedback": { 
										"question1": { 
											"text": "How were your drinking needs?",
											"rating": 3, 
											"ratingtype": "ratingbar",
											"ratingtext": {
												"1": "Much lower than expected",
    											"2": "Lower than expected",
											    "3": "Normal",
										        "4": "Higher than expected",
										        "5": "Much higher than expected"
											},
										}, 
										"question2": {
											"text": "Did you take more breaks today than you expected?",
											"rating": 3, 
											"ratingtype": "ratingbar",
											"ratingtext": {
												"1": "Not exhausted at all",
												"2": "Less exhausted than usual",
												"3": "Normal",
												"4": "More exhausted than usual",
												"5": "A lot more exhausted than usual"
											},
										},
										"question3": {
											"text": "How would you evaluate the amount of clothing you wore today?",
											"rating": 3, 
											"ratingtype": "ratingbar",
											"ratingtext": {
												"1": "Much less than needed",
												"2": "Less than needed",
												"3": "I wore the right amount of clothing",
												"4": "A little too much clothing",
												"5": "A lot more than needed"
											},
										},
										"comment": ""
									},
									"user_info": {
										"firstLogin": true,
										"deviceid": function(){ return device.uuid },
										"hasExternalDBRecord": false,
										"receivesNotifications": false // false as notifications are not part of the app
									},
									"thermalindices":{ 
												"ireq":[//array of objects
													{ 	"ICLminimal":0.0,
							  						    "ICLneutral": 0.0,
									 				    "DLEneutral": 0.0,
														"DLEminimal": 0.0,
														"utc":"2019/12/31 00:00:00",
													}],
											  	"phs": [//array of objects
													{ 
														"D_Tre" : 0.0,
													   	"Dwl50": 0.0,
													   	"SWtotg": 0.0,
													    "utc":"2019/12/31 00:00:00",
											  		}],
												"wbgt": { "RAL" : function(){
																		let M = self.knowledgeBase.settings.M(); //W/m2
																		let BSA = self.knowledgeBase.settings.BSA(); //m2
																		let watt = M * BSA;
																		return 59.9 - 14.1 * Math.log10( watt );
																	},
														"risk" : function( wbgt ){ //wbgt from weather report
																		let RAL = self.knowledgeBase.thermalindices.wbgt.RAL();
																		let risk = wbgt / RAL; 
																		if (risk >= 1.2 ){
																			return 3 * ( risk / 1.2 );
																		}
																		else if (risk > 1.0 ){
																			return 2 * ( risk );
																		}
																		else if (risk <= 1.0 ){
																			return ( risk / 0.8); // scale 0.8 to 1
																		}
																		
																	}
												},
												"windchill":{ 
													"risk": function( windchill ){ //returns time before frostbite in minutes
														if( windchill <-50 ){
															return 2;
														}
														else if( windchill < -40 ){
															return 10;
														}
														else if( windchill < -20 ){
															return 30;
														}
														else if( windchill < -15 ){
															return 60;
														}
														else return false; //no risk
													}
												}
									},
									"gauge":{
										"cold":{
											"title": function( val ){ 
												if ( val <= 1 ) return "no thermal stress";
												else if ( val < 2 ) return "minor cold stress";
												else if ( val < 3 ) return "significant cold stress";
												else if ( val < 4 ) return "high cold stress";
												else if ( val < 5 ) return "severe cold stress";
												else return "extreme cold stress";
										 	}
										},
										"heat":{
											"title":function( val ){  
												if ( val < 1 ) return "no thermal stress";
												else if ( val < 2 ) return "minor heat stress";
												else if ( val < 3 ) return "significant heat stress";
												else if ( val < 4 ) return "high heat stress";
												else if ( val < 5 ) return "severe heat stress";
												else return "extreme heat stress";
											}
										},
										"highlights":[//color also in CSS, keep consistent
									        { from: 3, to: 4, color:  'rgba(180,0,0,.9)', css:'veryhot'},
									        { from: 2, to: 3, color: 'rgba(255,100,0,.9)', css:'hot'},
									        { from: 1, to: 2, color: 'rgba(220,220,0,.9)', css:'warm'},
									        { from: -1, to: 1, color: 'rgba(0,180,0,.9)', css:'neutral' },
									        { from: -2, to: -1, color:  'rgba(0,180,180,.9)', css:'cool' },
											{ from: -3, to: -2, color: 'rgba(0,100,255,.9)', css:'cold' },
											{ from: -4, to: -3, color: 'rgba(0,0,180,.9)', css:'verycold' }
										]
									},
									"thresholds":{
										"ireq":{
											"icl": 1.0 //ireq > "icl-value" -> 
										},
										"phs":{
											"duration": 120, //duration limit <= "icl-value" -> 
											"sweat":1.0,     //sweat rate per hour >= "icl-value" ->
										},
										"windchill":{
											"deltaT": 3
										}	
									},
									"tips":{
										"windchill": function(index){
											let str = "";
											let windchill = self.knowledgeBase.thermalindices.ireq[index].windchill;
											if( windchill <
												( self.knowledgeBase.thermalindices.ireq[index].Tair -
													self.knowledgeBase.thresholds.windchill.deltaT )){
														str += "<p>Winchill is "+windchill.toFixed(0)+"&deg;, you could wear a windstopper to combat cold stress.</p>";
											}
											else if(self.knowledgeBase.thermalindices.ireq[index].ICLminimal >
												 	self.knowledgeBase.thresholds.ireq.icl ){
												str += "<p>Dress in layers to combat the cold stress.</p>";
											}
											let windrisk = self.knowledgeBase.thermalindices.windchill.risk( windchill );
											if( windrisk ){
												str += "<p>Due to the windchill "+windchill.toFixed(0)+"&deg; there is a risk for exposed skin to freeze in "+ windrisk +" minutes.</p>";
											}
											
											return str;
										},
										"phs": function( index ){
											let str = "";
											let d_sw = self.knowledgeBase.thermalindices.phs[ index].Dwl50;
											let sw_tot_per_hour = 0.001 * 60 * self.knowledgeBase.thermalindices.phs[ index].SWtotg / 
											(self.knowledgeBase.sim.duration ); //liter per hour
											sw_tot_per_hour = sw_tot_per_hour.toFixed(1);
		
											let duration_threshold = self.knowledgeBase.thresholds.phs.duration;
											let sweat_threshold = self.knowledgeBase.thresholds.phs.sweat;
											
											//hydration
											if( sw_tot_per_hour >= sweat_threshold ){
												str += "In these conditions you could need " +sw_tot_per_hour+ " liter water per hour";
											}
											
											let humidity = self.knowledgeBase.thermalindices.phs[ index].rh;
											let temperature = self.knowledgeBase.thermalindices.phs[ index].Tair;
											//humidity
											if( humidity >= 50 && temperature >35 ){
												str += "A fan will not help in this condition, and can even make things worse!";
											}
											
											//radiation
											return str;
										},
										"neutral": function(){
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
									},
									"sim":{
										"duration": 240, //minutes (required for PHS)
									},
									clothing:{
										icon: function( clo ){
											if( clo > 3 ) return "./img/clothing/2.0clo.png";
											else if( clo > 2 ) return "./img/clothing/2.0clo.png";
											else if( clo > 1.5 ) return "./img/clothing/1.5clo_wind.png";
											else if( clo > 1.1 ) return "./img/clothing/1.0clo.png";
											else if( clo > 0.8 ) return "./img/clothing/0.9clo.png";
											else return "./img/clothing/0.5clo.png";
										}
									}
								  };
		}

	},
	/* In the future this should be used to fetch the needed question from the database
	   Currently working with static content, just for proof of concept. */
	/*loadFeedbackQuestions: function() {
		feedback = $.getJSON("../data/feedbackQuestions.json", function(result){
		result = JSON.parse(result);
			self.knowledgeBase.feedback.question1.text = result.question1.text;
			self.knowledgeBase.feedback.question2.text = result.question2.text;
			self.knowledgeBase.feedback.question3.text = result.question3.text;
		});
		var uuid = device.uuid;
		// Implement logic to handle different types of rating bars
	},*/
	getSelectables: function( key ){
		var self = this;
		var obj_array = [];
		if( key.slice(0, 3) === "age" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+12) + " years", value: (i+12) });
			}
		}
		else if( key === "height" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.settings.unit.value === "SI") {
					obj_array.push({description: (i+120) + " " + this.knowledgeBase.settings.height.unit(), value: (i+120)  } );
				} else { // feet, inches (still want to save in cm, not changing value)
					obj_array.push({description: ((i+120)/30.48).toFixed(1) + " " + this.knowledgeBase.settings.height.unit(), value: (i+120)  } );
				}
			}
		}
		else if( key === "weight" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.settings.unit.value === "SI") {
					obj_array.push({description: (i+40) + " " + this.knowledgeBase.settings.weight.unit(), value: (i+40) } );
				} else if (this.knowledgeBase.settings.unit.value === "US") {
					// (still want to save in kg, not changing value)
					obj_array.push({description: Math.round((i+40) * 2.2046) + " " + this.knowledgeBase.settings.weight.unit(), value: (i+40) } );					
				} else { // only UK left
					// (still want to save in kg, not changing value)
					obj_array.push({description: (6+i*0.1).toFixed(1) + " " + this.knowledgeBase.settings.weight.unit(), value: (i+40) } );					
				}
			}
		}
		else if( key === "gender" ){
			obj_array.push({description: "Female", value: "Female" } );
			obj_array.push({description: "Male", value: "Male" } );
		}
		else if (key === "unit"){
			obj_array.push({description: "SI: kg, cm, m/s, Celcius", value: "SI" } );
			obj_array.push({description: "US: lbs, inch, m/s, Fahrenheit", value: "US" } );
			obj_array.push({description: "UK: stone, inch, m/s, Celcius", value: "UK" } );
		}
		return obj_array;
	},
	saveSettings: function(){
		let jsonData = JSON.stringify( this.knowledgeBase );
		localStorage.setItem("knowledgebase", jsonData );
	},
	updateLocation: function(){
		//$('i.fa-sync-alt').toggleClass("fa-spin");
		var self = this; //copy current scope into local scope for use in anonymous function 
		let options = {timeout: 30000 };
		
		navigator.geolocation.getCurrentPosition( 
			function( position ){ //on success
				self.knowledgeBase.position.lat = position.coords.latitude;
				self.knowledgeBase.position.lng = position.coords.longitude;
				self.knowledgeBase.position.timestamp = new Date( position.timestamp ).toJSON();
				console.log( "loc found: " + JSON.stringify( position.coords ) );
				self.updateWeather();
				//setTimeout( function(){ $('i.fa-sync-alt').toggleClass("fa-spin") }, 1000 );
				
			}, 
			function( error ){ //on error
				console.log( error );
			},
			options
		);
	},
	updateWeather: function(){
		var self = this;
		if( 'position' in this.knowledgeBase ){
			let appid = "f22065144b2119439a589cbfb9d851d3";
			let url = "https://www.sensationmapps.com/WBGT/api/worldweather.php";
			let data = { "action": "helios",
						 "lat": this.knowledgeBase.position.lat,
					 	 "lon": this.knowledgeBase.position.lng,
						 "climapp": appid,
						 "d": 10.0, //
					 	 "utc": new Date().toJSON() };
						 console.log( data );
			$.get( url, 
				   data, 
				   function( output ){//on success
					   try{
					   	   let weather = JSON.parse( output );
						   self.knowledgeBase.weather.station = weather.station;
						   self.knowledgeBase.weather.distance = weather.distance ? weather.distance : 0;
						   self.knowledgeBase.weather.utc = "utc" in weather ? weather.utc : weather.dt;
					   	   self.knowledgeBase.weather.utc = self.knowledgeBase.weather.utc.map( function(val){
							   	let str = val.replace(/-/g,"/");
								str += " UTC";
								return str;
					   	   });
						   self.knowledgeBase.weather.lat = weather.lat;
						   self.knowledgeBase.weather.lng = weather.lon;
						   self.knowledgeBase.weather.wbgt = weather.wbgt_max.map(Number);
						   self.knowledgeBase.weather.windchill = weather.windchill.map(Number);
						   self.knowledgeBase.weather.temperature = weather.tair.map(Number);
						   self.knowledgeBase.weather.globetemperature = weather.tglobe.map(Number);
						   self.knowledgeBase.weather.humidity = weather.rh.map(Number);
						   self.knowledgeBase.weather.watervapourpressure = [];
						   $.each( self.knowledgeBase.weather.humidity,
							   function( key, val){
								   let T = self.knowledgeBase.weather.temperature[key];
								   let wvp = ( val * 0.01) * Math.exp( 18.965 - 4030/(T+235));	
								   self.knowledgeBase.weather.watervapourpressure.push( wvp );	
						   }); 
						   self.knowledgeBase.weather.windspeed = weather.vair.map(Number).map( function( v ){
							   return Math.pow( v, 0.16 );
						   } );
						   
						   self.knowledgeBase.weather.radiation = weather.solar.map(Number);
		   				   self.saveSettings();
						   self.calcThermalIndices();
						   self.updateUI();
							  
						   // Only update when weather data has been received
						   if(!self.knowledgeBase.user_info.hasExternalDBRecord) {
								self.createUserRecord();
								self.knowledgeBase.user_info.hasExternalDBRecord = true;
							}
							self.addWeatherDataToDB();
					   }
					   catch( error ){
						   console.log( error );
					   }
			}).fail(function( e ) {
					
					console.log("fail in weather "+ e);
  			});
		}

		// Schedule a notification if weather conditions are out of the ordinary
		// functionality will be extended to handle more complex scenarios - only when not in browser
		if(device.platform != 'browser') {
			var threshold = 0;
			if(self.knowledgeBase.weather.wbgt < threshold) {
				//self.scheduleDefaultNotification();
			}
		}
	},
	loadUI: function( pageid ){
		var self = this;
		console.log(this.pageMap[pageid]);
		$.get( this.pageMap[ pageid ], function( content ){
			console.log( "loaded: " + pageid);
			self.currentPageID = pageid;
			$("#content").html( content );
			self.updateUI();
		})
	},
	calcThermalIndices: function( ){
		this.knowledgeBase.thermalindices.ireq = [];
		this.knowledgeBase.thermalindices.phs = [];
		
		var options =  {	air:{},
							body:{
									"M": this.knowledgeBase.settings.M(), 	//W/m2 
									"work": 	0,		//W/m2 external work 
									"posture": 	2,		//1= sitting, 2= standing, 3= crouching
									"weight":   this.knowledgeBase.settings.weight.value,		//kg  
									"height": 	this.knowledgeBase.settings.height.value / 100,	//m
									"drink": 	0,	// may drink freely
									"accl": 	0		//% acclimatisation state either 0 or 100						
							},
							cloth:{
									"Icl": 		0.8, 	//clo
									"p": 		50, 	// Air permeability (low < 5, medium 50, high > 100 l/m2s)
									"im_st": 	0.38, 	// static moisture permeability index
									"fAref": 	0.54,	// Fraction covered by reflective clothing
									"Fr": 		0.97,	// Emissivity reflective clothing
							},
							move:{
									"walk_dir":	NaN, 	//degree walk direction
									"v_walk": 	0,	//m/s walking speed
							},
							sim: {
									"mod": 0
							}
						};	
		var self = this;
		$.each( this.knowledgeBase.weather.temperature, function(index, val ){
			options.air = {
							"Tair": self.knowledgeBase.weather.temperature[index], 	//C
							"rh": 	self.knowledgeBase.weather.humidity[index], 	//% relative humidity
							"Pw_air": self.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
							"Trad": self.knowledgeBase.weather.globetemperature[index], 	//C mean radiant temperature
							"v_air": self.knowledgeBase.weather.windspeed[index], 	//m/s air velocity at ground level
			};
			heatindex.IREQ.set_options( options );
			heatindex.IREQ.sim_run();

			var ireq = heatindex.IREQ.current_result();
			var ireq_object = {
				"ICLminimal": ireq.ICLminimal,
				"DLEminimal": ireq.DLEminimal,
				"ICLneutral": ireq.ICLneutral,
				"DLEneutral": ireq.DLEneutral,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air,
				"Trad":options.air.Trad,
				"rad":self.knowledgeBase.weather.radiation[index],
				"wbgt": self.knowledgeBase.weather.wbgt[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			};
			self.knowledgeBase.thermalindices.ireq.push( ireq_object );

			heatindex.PHS.set_options( options );
			heatindex.PHS.sim_init();

			let simduration = self.knowledgeBase.sim.duration;
			for( var i=1;i<=simduration;i++){
				var res = heatindex.PHS.time_step();
			}
			var phs = heatindex.PHS.current_result();
			var phs_object = {
				"D_Tre": phs.D_Tre,
				"Dwl50": phs.Dwl50,
				"SWtotg": phs.SWtotg,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air,
				"Trad":options.air.Trad,
				"rad":self.knowledgeBase.weather.radiation[index],
				"wbgt": self.knowledgeBase.weather.wbgt[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			};
			self.knowledgeBase.thermalindices.phs.push( phs_object );	
		});
		
		this.knowledgeBase.thermalindices.ireq.sort(function(a,b){
			return new Date(a.utc) - new Date(b.utc);
		});
		this.knowledgeBase.thermalindices.phs.sort(function(a,b){
			return new Date(a.utc) - new Date(b.utc);
		});
			
	},
	updateUI: function(){
		// context dependent filling of content
		this.initNavbarListeners();
		
		if( this.currentPageID == "onboarding"){
			console.log("first time login: true");
		}
		else if( this.currentPageID == "dashboard" ){
			
			this.initGeolocationListeners();
			this.initActivityListeners();
			let selected = this.knowledgeBase.activity.selected;
			
			$("div[data-target='"+selected+"']").addClass("selected");
			let caption_ = this.knowledgeBase.activity.label[ selected ];
			$("#activityCaption").html( caption_ );
			
			var currentindex = -1;
			var self = this;
			const ms_p_hour=(1000*60*60);
			const ms_p_day = ms_p_hour * 24;
			var localdatetime = new Date();
			var localutc = new Date( localdatetime.toISOString() );
			var localdate = new Date( localdatetime.toDateString() );
			var datemap = {"now": "current",
							"-1": "yesterday",
						   "0": "today",
							"1": "tomorrow",
							"2": "in 2 days",
							"3": "in 3 days",
							"4": "in 4 days",
							"5": "in 5 days"};
			var forecastarray = [];
			
			//BK: consider to move this logic in the calcthermal indices
			$.each( this.knowledgeBase.thermalindices.ireq, function(index, obj ){
				let utc = new Date( obj.utc ); //
				//console.log( obj.utc + " " +utc );
				let lt = utc.toLocaleTimeString(navigator.language, { //language specific setting
						hour: '2-digit',
					    minute:'2-digit'
				});
				
				//check if forecast is within 3 hours
				let dif = (utc - localutc) / ms_p_hour;
				let utcdate = new Date( utc.toDateString() );
				let daydiff = Math.floor( ( utcdate - localdate ) / ms_p_day );
				
				let wbgt = self.knowledgeBase.weather.wbgt[index];
				let hrisk = self.knowledgeBase.thermalindices.wbgt.risk( wbgt );
				let crisk = obj.ICLminimal;
				let daydiffkey = daydiff;
				
				self.knowledgeBase.thermalindices.ireq[index].isnow = false;
				self.knowledgeBase.thermalindices.phs[index].isnow = false;
				if ( ( currentindex === -1 && Math.abs(dif) < 2 ) || //current timebox
					 ( index ===0 && dif > 0 ) //first timebox is already in future...
					){
					currentindex = index;
					daydiffkey = "now";
					self.knowledgeBase.thermalindices.ireq.isnow = true;
					self.knowledgeBase.thermalindices.phs[index].isnow = true;
					self.selectedWeatherID = index;
				}
				
				var element = {"index": index,
								"cold": crisk,
								"heat": hrisk,
							   "time": lt,
							   "daydiff": daydiff,
							   "day": datemap[ daydiffkey ]
				};
				forecastarray.push( element );
			});
			var forecasts = "";
			
			if (currentindex > -1){
				var base_val = this.determineThermalIndexValue( forecastarray[currentindex].cold, 
																forecastarray[currentindex].heat, 
																currentindex );
			
				var yesterday_val = undefined;
				var yesterday_string = "";
			
				$.each( forecastarray, function(index, e ){
					if( e.daydiff==-1 && e.time == forecastarray[currentindex].time ){ //24h before
						yesterday_val = self.determineThermalIndexValue( e.cold, e.heat, index ).toFixed(1);
						let percval = (100*((yesterday_val - base_val)/base_val));
						let sign = percval >= 0 ? "+" : "";
						let interpretation = base_val > yesterday_val ? "warmer" : "colder";
						yesterday_string = sign + percval.toFixed(0) + "% " + interpretation + " than yesterday " + e.time;
						$("#yesterday").html( yesterday_string );
					}
					//from current until tomorrow, but not further
					if( index > currentindex && ( e.daydiff < 2 ) ){
						var val = self.determineThermalIndexValue( e.cold, e.heat, index ).toFixed(1);
						let highlight = self.knowledgeBase.gauge.highlights.filter( function( obj ){
							return ( val > obj.from || (obj.from === -4 && val <= -4) ) && val <= obj.to;
						});					
					
						let header = "Next " + (index-currentindex)*3 + " hours";
						let footer = (e.daydiff > 0 ) ? e.day : "&nbsp;";
					
						/* HTML string appending */		
						forecasts += "<div data-listener='forecast' data-index='"+index+"'>";
						forecasts += "<p>" + header + " </p>";
						forecasts += "<p class='"+ highlight[0].css + "'>" + val + "</p>";
						forecasts += "<p>" + e.time + "</p>"; 
						forecasts += "<p>" + footer + "</p>"; 
						forecasts += "</div>";
					}
				});
			}
			else{
				forecasts += "<p>No weather data available</p>";
			}
			$("#forecasts").html( forecasts );
			if( currentindex > -1 ){
				this.initForecastListeners();
				this.updateInfo( currentindex );
			}			
				
		}
		else if( this.currentPageID == "details"){
			var index = this.selectedWeatherID;
			
			let tair = this.knowledgeBase.thermalindices.phs[index].Tair.toFixed(1);
			let rh = this.knowledgeBase.thermalindices.phs[index].rh.toFixed(0);
			let rad = this.knowledgeBase.thermalindices.phs[index].rad.toFixed(0);
			let vair = this.knowledgeBase.thermalindices.phs[index].v_air.toFixed(1);
			$("#detail_airtemp").html(tair + "&#xb0");
			$("#detail_rh").html(rh + "%");
			$("#detail_rad").html(rad + "W/m<sup>2</sup>");
			$("#detail_wind").html(vair + "m/s");
			
			let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
			let wbgt = this.knowledgeBase.thermalindices.phs[index].wbgt.toFixed(1);
			let heat_index = this.knowledgeBase.thermalindices.wbgt.risk( wbgt );
			
			let draw_cold_gauge = this.isDrawColdGauge( icl_min, heat_index, index );
			let draw_heat_gauge = this.isDrawHeatGauge( icl_min, heat_index, index );
		
			if( draw_cold_gauge ){
				$("div[data-context='heat'],div[data-context='neutral']").hide();
				$("div[data-context='cold']").show();
				
				let windchill = this.knowledgeBase.thermalindices.ireq[index].windchill.toFixed(1);
				let windrisk = this.knowledgeBase.thermalindices.windchill.risk( windchill );
				let windriskcat = windrisk ? "a risk of frostbite in" : "no risk of frostbite";
				$("#detail_windchill").html( windchill);
				$("#detail_windriskcat").html( windriskcat );
				if( windrisk ){
					$("#detail_windrisk").html( windrisk + " minutes");
				}
				
				let icl_max = this.knowledgeBase.thermalindices.ireq[ index].ICLneutral;
				
				let dle_min = 60 * this.knowledgeBase.thermalindices.ireq[ index].DLEminimal;
				dle_min = dle_min.toFixed(0);
				
				let activity = this.knowledgeBase.activity.selected;
				$("#detail_activity_ireq").html(activity);
				$("#detail_icl_max").html( icl_max );
				$("#detail_icl_min").html( icl_min );
				
				let minicon = this.knowledgeBase.clothing.icon( icl_min);
				let maxicon = this.knowledgeBase.clothing.icon( icl_max);
				
				$("#detail_min_clo").html("<img src='"+minicon+"' class='small'/>");
				$("#detail_max_clo").html("<img src='"+maxicon+"' class='small'/>");
				
				$("#detail_dle_ireq").html( dle_min );	
			}
			else if( draw_heat_gauge ){
				$("div[data-context='cold'],div[data-context='neutral']").hide();
				$("div[data-context='heat']").show();
				
				$("#detail_wbgt").html( wbgt );
				let ral = this.knowledgeBase.thermalindices.wbgt.RAL().toFixed(1);
				$("#detail_ral").html( ral );
				
				let d_tre = this.knowledgeBase.thermalindices.phs[ index].D_Tre;
				let d_sw = this.knowledgeBase.thermalindices.phs[ index].Dwl50;
				let sw_tot_per_hour = 0.001 * 60 * this.knowledgeBase.thermalindices.phs[ index].SWtotg / 
				(this.knowledgeBase.sim.duration ); //liter per hour
				sw_tot_per_hour = sw_tot_per_hour.toFixed(1);
				
				$("#detail_sweat").html( sw_tot_per_hour );
				$("#detail_dle_phs").html( d_tre );
			}
			else{
				$("div[data-context='cold'],div[data-context='heat']").hide();
				$("div[data-context='neutral']").show();
			}
						
			
			
		
		
		
		}
		else if( this.currentPageID == "settings" ){
			this.initSettingsListeners();
			$("#age").html( this.knowledgeBase.settings.age.value );
			$("#height").html( this.knowledgeBase.settings.height.calculated_value() + " " + this.knowledgeBase.settings.height.unit());
			$("#weight").html( this.knowledgeBase.settings.weight.calculated_value() + " " + this.knowledgeBase.settings.weight.unit());
			$("#gender").html( this.knowledgeBase.settings.gender.value );
			$("#notification_checkbox").attr("checked", this.knowledgeBase.user_info.receivesNotifications);
			$("#select_unit").val(this.knowledgeBase.settings.unit.value);
		}
		else if( this.currentPageID == "feedback" ){
			this.initFeedbackListeners();
			// Question text
			$("#question1").html( this.knowledgeBase.feedback.question1.text );
			$("#question2").html( this.knowledgeBase.feedback.question2.text );
			$("#question3").html( this.knowledgeBase.feedback.question3.text );

			// Rating bar values -- still not setting the default color..
			$("input[id='1star"+this.knowledgeBase.feedback.question1.rating+"']").attr("checked", true);
			$("input[id='2star"+this.knowledgeBase.feedback.question2.rating+"']").attr("checked", true);
			$("input[id='3star"+this.knowledgeBase.feedback.question3.rating+"']").attr("checked", true);
		}
	},
	isDrawColdGauge: function( cold, heat, index ){
		return cold >= heat;
				// && 
				//cold >= this.knowledgeBase.thresholds.ireq &&
				//this.knowledgeBase.thermalindices.ireq[ index].Tair <= 15;
	},
	isDrawHeatGauge: function( cold, heat, index ){
 	   return heat > cold;
			//&& this.knowledgeBase.weather.wbgt[ index ] >= 20;
	},
	determineThermalIndexValue: function( cold, heat, index ){
		let value = cold > heat ? -cold : heat;
		value = this.isDrawColdGauge( cold, heat, index ) ? -cold : value;
		value = this.isDrawHeatGauge( cold, heat, index ) ? heat : value;
		return Math.max( -4, Math.min( 4, value ) );//value between -4 and +4
	},
	updateInfo: function( index ){
		this.selectedWeatherID = index;
		if( 'weather' in this.knowledgeBase && this.knowledgeBase.weather.station !== "" ){
			let distance = parseFloat( this.knowledgeBase.weather.distance ).toFixed(0);
			console.log( "utc: "+ index );
			let utc_date = new Date( this.knowledgeBase.thermalindices.ireq[ index ].utc ); //
			let local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
					hour: '2-digit',
				    minute:'2-digit'
			});
			$("#current_time").html( local_time );
			$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
			$("#temperature").html( this.getTemperatureInPreferredUnit(this.knowledgeBase.thermalindices.ireq[ index].Tair).toFixed(0) +"&#xb0" );
			$("#windspeed").html( this.knowledgeBase.thermalindices.ireq[ index].v_air.toFixed(0) );
			$("#temp_unit").html(this.knowledgeBase.weather.temperature_unit()); 
			$("#humidity").html(  this.knowledgeBase.thermalindices.ireq[ index].rh.toFixed(0) );
			
		
			let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
			let cold_index = icl_min;
			let heat_index = this.knowledgeBase.thermalindices.wbgt.risk( this.knowledgeBase.thermalindices.phs[index].wbgt );
		
			let draw_cold_gauge = this.isDrawColdGauge( cold_index, heat_index, index );
			let draw_heat_gauge = this.isDrawHeatGauge( cold_index, heat_index, index );
		
			let tip_html = "";
			
		
			if( draw_cold_gauge ){
				tip_html += this.knowledgeBase.tips.windchill( index );
			}
			else if( draw_heat_gauge ){
				tip_html += this.knowledgeBase.tips.phs( index );
			}
			if( tip_html.length ==0){
				tip_html += this.knowledgeBase.tips.neutral();
			}
			
			let windowsize = $( window ).width();
			let width = windowsize / 2;
		
			let value = this.determineThermalIndexValue( cold_index, heat_index, index );
			let thermal = draw_cold_gauge ? "cold" : "heat";
			this.drawGauge( 'main_gauge', width, value , thermal );
		
			$("#tips").html( tip_html );
		}
		
		
	},
	drawGauge: function( id, width, value, key ){
		var c = $("#"+id), 
        	ctx = c[0].getContext('2d');
		
		if( ctx.canvas.width !== width || ctx.canvas.height !== width){
			ctx.canvas.height = width;
			ctx.canvas.width = width;
		}
		
		var title = this.knowledgeBase.gauge[key].title( Math.abs(value) );
		var highlights =  this.knowledgeBase.gauge.highlights;
		var gauge = new RadialGauge({
		    renderTo: id,
		    width: width,
		    height: width,
		    units: ' ',
		    title: title,
		    value: value,
		    minValue: -4,
		    maxValue: 4,
			startAngle: 45,
    		ticksAngle: 270,
		    majorTicks: [-4,-3,-2,-1,0,1,2,3,4],
		    minorTicks: 2,
		    strokeTicks: true,
		    highlights: highlights,
		    colorPlate: '#fff',
			borderShadowWidth: 2,
			borders: true,
		    colorMajorTicks: '#f5f5f5',
		    colorMinorTicks: '#ddd',
		    colorTitle: '#000',
		    colorUnits: '#111',
		    colorNumbers: '#111',
		    colorNeedle: 'rgba(200, 200, 200, 0.3)',
		    colorNeedleEnd: 'rgba(33, 33, 33, .7)',
			colorBorderShadow: 'rgba(33, 33, 33, .7)',
			colorValueText: "#000",
		    colorValueBoxRect: "#fff",
		    colorValueBoxRectEnd: "#fff",
		    colorValueBoxBackground: "#fff",
		    colorValueBoxShadow: false,
		    colorValueTextShadow: false,
			valueInt: 1,
    		valueDec: 1,
		    valueBox: true,
			needleType: "line",
			needleShadow: true,
		    animationRule: 'elastic',
		    animationDuration: 3000
		});
		
		gauge.draw();
	}, 
	getTemperatureInPreferredUnit: function(temp) {
		let self = this;
		let unit = self.knowledgeBase.settings.unit.value;
		if(unit === "US") {
			return temp * 9/5 + 32;
		} else {
			return temp;
		}
	},
	getGenderAsInteger: function() {
		return this.knowledgeBase.settings.gender.value === 'Male' ? 1 : 0;
	},
	/*
	 * Methods related to database 
	 */
	createUserRecord: function(){
		let self = this;
		let ip = "http://192.38.64.244";
		let url = ip + "/ClimAppAPI/v1/ClimAppApi.php?apicall=createUserRecord";
		let user_data = {"_id": self.knowledgeBase.user_info.deviceid,
						 "age": self.knowledgeBase.settings.age.value,
						 "gender": self.getGenderAsInteger(), 
						 "height": (self.knowledgeBase.settings.height.value/100), // unit is meter in database (SI)
						 "weight": self.knowledgeBase.settings.weight.value, 
						 "unit": 0}  
		$.post(url, user_data).done(function(data, status, xhr){
			if(status === "success") {
				console.log("Database update, user: " + data);
			}
		});
	},
	addWeatherDataToDB: function(){
		let self = this;
		let ip = "http://192.38.64.244";
		let url = ip + "/ClimAppAPI/v1/ClimAppApi.php?apicall=createWeatherRecord";
		let user_data = {
					"_id": self.knowledgeBase.user_info.deviceid,
					"longitude": self.knowledgeBase.weather.lat,
					"latitude": self.knowledgeBase.weather.lng, 
					"city": self.knowledgeBase.weather.station,
					"temperature": self.knowledgeBase.weather.temperature[0], 
					"wind_speed": self.knowledgeBase.weather.windspeed[0], 
					"humidity": self.knowledgeBase.weather.humidity[0]/100, 
					"cloudiness": 0, // Not in knowledgebase?
					"activity_level": self.knowledgeBase.activity.selected,
					"acclimatization": 0, // currently not retrieved from sensationsmaps
					"temp_min": 0, // currently not retrieved from sensationsmaps
					"temp_max": 0 // currently not retrieved from sensationsmaps
				}  
		$.post(url, user_data).done(function(data, status, xhr){
			if(status === "success") {
				console.log("Database update, weather: " + data);
			}
		});
	},
	addFeedbackToDB: function(){
		let self = this;
		let ip = "http://192.38.64.244";
		let url = ip + "/ClimAppAPI/v1/ClimAppApi.php?apicall=createFeedbackRecord";
		let user_data = {
					"user_id": self.knowledgeBase.user_info.deviceid,
					"question_combo_id": 1, // will be changed when more sophisticaed solution is implemented
					"rating1": self.knowledgeBase.feedback.question1.rating, 
					"rating2": self.knowledgeBase.feedback.question2.rating,
					"rating3": self.knowledgeBase.feedback.question3.rating, 
					"txt": self.knowledgeBase.feedback.comment === "" ? "_" : self.knowledgeBase.feedback.comment 				
				}  
		$.post(url, user_data).done(function(data, status, xhr){
			if(status === "success") {
				console.log("Database update, feedback: " + data);
				self.showShortToast("Feedback submitted!");
			}
		});
	},
	// Updating user parameter in database when/if user should choose to change the value
	updateDBParam: function(param){
		let self = this;
		let ip = "http://192.38.64.244";
		let urlsuffix = ip + "/ClimAppAPI/v1/ClimAppApi.php?apicall=updateUser";
		let fieldToUpdate = param.charAt(0).toUpperCase() + param.slice(1); // Capitalizing to match API requirement		
		let url = urlsuffix + fieldToUpdate;
		let user_data = {
				"_id": self.knowledgeBase.user_info.deviceid,		
			}
		// Add value to be updated to data object 
		if(param === "gender") { 
			user_data[param] = self.getGenderAsInteger();
		} else {
			user_data[param] = self.knowledgeBase.settings[param].value;
		}
		$.post(url, user_data).done(function(data, status, xhr){
			if(status === "success") {
				console.log("Database update" + param + ": " + 
				self.knowledgeBase.settings[param].value + ", " + 
				self.getGenderAsInteger());
			}
		});
	},
	// Toast 
	showShortToast: function(textToShow){
		if(device.platform != 'browser') {
			window.plugins.toast.showWithOptions(
			{
				message: textToShow,
				duration: "short", // 2000 ms
				position: "bottom",
				addPixelsY: -40  // giving a margin at the bottom by moving text up
			});
		}
	}	
	/* 
	 * Scheduling notifications
	 

	// Using local-notification
	scheduleDefaultNotification: function() {
		var self = this;
		// If no notifications are already scheduled
		self.getAllNotifications();

		// Used for testing purposes
		//console.log(this.cancelAllNotifications());

		// TODO: Decide criteria for sending notification!
		// Only if user wants notification (have not chosen to opt out)
		if(self.knowledgeBase.weather.wbgt < 1 && self.knowledgeBase.user_info.receivesNotifications) {
			// Set notification time and date today @ 4.30PM
			var today = new Date();
			today.setDate(today.getDate());
			today.setHours(16);
			today.setMinutes(30);
			today.setSeconds(0);
			var today_at_4_30_pm = new Date(today);

			// Notification which is triggered 16.30 every weekday
			cordova.plugins.notification.local.schedule({
				title: 'Feedback',
				text: 'How was your day?',
				smallIcon: 'res://icon-stencil',
				icon: 'res://icon',
				trigger: {
					type: "fix",
					at: today_at_4_30_pm.getTime()
			},
			actions: [
				{ id: 'feedback_yes', title: 'Open'},
				{ id: 'no',  title: 'Dismiss'}
			]
			});	
			
			// When user clicks "open" the feedback screen is opened
			cordova.plugins.notification.local.on('feedback_yes', function (notification, eopts) { 
				self.loadUI('feedback');
			 });
		}
	},
	getAllNotifications: function() {
		cordova.plugins.notification.local.getScheduledIds(function (scheduledIds) {
			console.log(scheduledIds.length);
			console.log("Scheduled IDs: " + scheduledIds.join(", "));
		});
	},
	cancelAllNotifications: function() {
		cordova.plugins.notification.local.cancelAll(function () {
			console.log('All notifications canceled');
		});
	}*/
};

app.initialize();