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
				showShortToast("Whoops... something went wrong at: " + lineNumber);
		    }
        this.receivedEvent('deviceready');
		
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		this.loadSettings();
		if( this.knowledgeBase.user_info.isFirstLogin ){//onboarding
			this.loadUI( "onboarding" );
		}
		else{
			this.loadUI( "dashboard" );
		}
		this.updateLocation();
		this.saveSettings();
    },
	initNavbarListeners: function(){
		// navigation menu
		var self = this;
		$("div[data-listener='navbar']").off();
		$("div[data-listener='navbar']").on("click", function(){
			let target = $( this ).attr("data-target");
			self.knowledgeBase.user_info.isFirstLogin = 0;
		    self.saveSettings();
			if(self.firstTimeLoginWithoutPersonalization(target)) {
				showShortToast("Using default values in calculations.");
			}
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
		    self.saveSettings();
			
		});
		
		// When user submits feedback, add to object to send to db + reset values
		$("div[data-listener='submit']").off();
		$("div[data-listener='submit']").on("touchstart", function(){
			var target = $("#feedback_text").val();
			self.knowledgeBase.feedback.comment = target;
			
			// If user not in database, add user to database
			if(!self.knowledgeBase.user_info.hasExternalDBRecord) {
				createUserRecord(self.knowledgeBase);
			} 
			// Add feedback to database
			addFeedbackToDB(self.knowledgeBase.feedback);
						
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
				if(["age", "gender", "height", "weight"].includes(target)) {
					updateDBParam(self.knowledgeBase, target);
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
			showShortToast(notificationText);
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
			//self.knowledgeBase.user_info.isFirstLogin = true;

			// Inform user about event in toast
			var notificationText = "Personal preferences reset, using default values.";
			showShortToast(notificationText);
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
			self.saveSettings();
			$( "div[data-listener='activity']" ).removeClass( "selected" );
			self.calcThermalIndices();
			self.updateUI();
		});	
	},
	initKnowledgeBase: function(){
			return {"version": 1.6,
					"user_info": {
							"isFirstLogin": 1,
							"hasExternalDBRecord": 0,
							"receivesNotifications": 0, // false as notifications are not part of the app
							"dtu_ip": "http://192.38.64.244",
							"dtu_api_base_url": "/ClimAppAPI/v1/ClimAppApi.php?apicall="
					},
					"position": { "lat": 0, 
									 "lng": 0, 
									 "timestamp": "" 
				    },
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
									"radiation": [-99]
						},
					  "settings": { "age": {"title": "What is your age?",
											"value": 36,
											"unit": "years"
									 },
									 "height": {"title": "What is your height?",
												"value": 186
									},
									 "weight": {"title": "What is your weight?",
												"value": 82
									},
									 "gender": {"title": "What is your gender?",
												"value": "Male"
									},
									 "unit": { "title": "Which units of measurements would you prefer?",
												 "value": "SI" 
											} // default SI units
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
						"thermalindices":{ 
									"ireq":[],
								  	"phs": [],
						},
						"gauge":{
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
								"deltaT": 5
							}	
						},
						"sim":{
							"duration": 240, //minutes (required for PHS)
						},
					};
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "./pages/dashboard.html",
						 "settings": "./pages/settings.html",
						 "feedback": "./pages/feedback.html",
		 				 "onboarding": "./pages/onboarding.html",
		 				 "disclaimer": "./pages/disclaimer.html",
						 "details": "./pages/details.html",
		 				 "about": "./pages/about.html"};
		
		//localStorage.clear(); // Need to clear local storage when doing the update
		var shadowKB = this.initKnowledgeBase();
		if ( localStorage.getItem("knowledgebase") !== null ) {
			
			this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase") );
			if ( 'version' in this.knowledgeBase && this.knowledgeBase.version < shadowKB.version ){
				this.knowledgeBase = this.initKnowledgeBase();
				console.log("knowledgebase updated to version : " + this.knowledgeBase.version );
				showShortToast("knowledgebase updated to version : " + this.knowledgeBase.version);
				
			}
			else if ('version' in this.knowledgeBase && this.knowledgeBase.version == shadowKB.version){
				console.log("loaded knowledgebase version : " + this.knowledgeBase.version );
				showShortToast("loaded knowledgebase version : " + this.knowledgeBase.version);
			}
			else{ //old version does not have version key
				this.knowledgeBase = this.initKnowledgeBase();
				console.log("knowledgebase updated to version : " + this.knowledgeBase.version );
				showShortToast("knowledgebase updated to version : " + this.knowledgeBase.version);
			}
		}
		else{
			this.knowledgeBase =this.initKnowledgeBase();	
			console.log("created knowledgebase version : " + this.knowledgeBase.version );
			showShortToast("created knowledgebase version : " + this.knowledgeBase.version );
					
		}
		this.saveSettings();

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
	firstTimeLoginWithoutPersonalization: function(target){
		var self = this;
		return self.knowledgeBase.user_info.isFirstLogin && target === 'dashboard';
	},
	getSelectables: function( key ){
		var self = this;
		let unit = this.knowledgeBase.settings.unit.value;
		var obj_array = [];
		if( key.slice(0, 3) === "age" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+12) + " years", value: (i+12) });
			}
		}
		else if( key === "height" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.settings.unit.value === "SI") {
					obj_array.push({description: (i+120) + " " + getHeightUnit(unit), value: (i+120)  } );
				} else { // feet, inches (still want to save in cm, not changing value)
					obj_array.push({description: ((i+120)/30.48).toFixed(1) + " " + getHeightUnit(unit), value: (i+120)  } );
				}
			}
		}
		else if( key === "weight" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.settings.unit.value === "SI") {
					obj_array.push({description: (i+40) + " " + getWeightUnit(unit), value: (i+40) } );
				} else if (this.knowledgeBase.settings.unit.value === "US") {
					// (still want to save in kg, not changing value)
					obj_array.push({description: Math.round((i+40) * 2.2046) + " " + getWeightUnit(unit), value: (i+40) } );					
				} else { // only UK left
					// (still want to save in kg, not changing value)
					obj_array.push({description: (6+i*0.1).toFixed(1) + " " + getWeightUnit(unit), value: (i+40) } );					
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
				console.log( "loc found: " + position.coords.latitude + "," + position.coords.longitude );
				self.updateWeather();
				//setTimeout( function(){ $('i.fa-sync-alt').toggleClass("fa-spin") }, 1000 );
				
			}, 
			function( error ){ //on error
				showShortToast("Could not retrieve location.");
				console.log( error );
			},
			options // here the timeout is introduced
		);
	},
	updateWeather: async function(){
		var self = this;
		
		if(!self.knowledgeBase.user_info.hasExternalDBRecord) {
			createUserRecord(self.knowledgeBase);
		}
		const appidFromServer = await getAppIDFromDB(self.knowledgeBase); // Making code execution wait for app id retrieval


		if(self.knowledgeBase.user_info.hasExternalDBRecord && appidFromServer) { 
			console.log("Fetched app ID: " + appidFromServer);
		} else {
			showShortToast(appidFromServer + " id received, yet no hasExternalDBRecord");			
		}
		let url = "https://www.sensationmapps.com/WBGT/api/worldweather.php";
		let data = { "action": "helios",
					 "lat": this.knowledgeBase.position.lat,
				 	 "lon": this.knowledgeBase.position.lng,
					 "climapp": appidFromServer,
					 "d": 1.0, //
				 	 "utc": new Date().toJSON() };
		$.get( url, 
			   data, 
			   function( output ){//on success
				   try{
				       let weather = JSON.parse( output );
					   console.log( output );
					   self.knowledgeBase.weather.station = weather.station;
					   self.knowledgeBase.weather.distance = weather.distance ? weather.distance : 0;
					   self.knowledgeBase.weather.utc = "utc" in weather ? weather.utc : weather.dt;
					   
					   //returns current weather by default in key "weather.currentweather"
					   //prepend to array.
					   self.knowledgeBase.weather.utc.unshift( weather.currentweather.dt );
					   
				   	   self.knowledgeBase.weather.utc = self.knowledgeBase.weather.utc.map( function(val){
						   	let str = val.replace(/-/g,"/");
							str += " UTC";
							return str;
				   	   });
					   
					   
					   self.knowledgeBase.weather.lat = weather.lat;
					   self.knowledgeBase.weather.lng = weather.lon;
					   
					   
					   
					   self.knowledgeBase.weather.wbgt = weather.wbgt_max.map(Number);
					   self.knowledgeBase.weather.wbgt.unshift( Number( weather.currentweather.wbgt_max ) );
					   
					   
					   self.knowledgeBase.weather.windchill = weather.windchill.map(Number);
					   self.knowledgeBase.weather.windchill.unshift( Number( weather.currentweather.windchill ) );
					   
					   
					   self.knowledgeBase.weather.temperature = weather.tair.map(Number);
					   self.knowledgeBase.weather.temperature.unshift( Number( weather.currentweather.tair ) );
					   
					   
					   self.knowledgeBase.weather.globetemperature = weather.tglobe.map(Number);
					   self.knowledgeBase.weather.globetemperature.unshift( Number( weather.currentweather.tglobe ) );
					   
					   
					   self.knowledgeBase.weather.humidity = weather.rh.map(Number);
					   self.knowledgeBase.weather.humidity.unshift( Number( weather.currentweather.rh ) );
					   
					   
					   self.knowledgeBase.weather.windspeed = weather.vair.map(Number);
					   self.knowledgeBase.weather.windspeed.unshift( Number( weather.currentweather.vair ) );
					    
					   
					   self.knowledgeBase.weather.radiation = weather.solar.map(Number);
					   self.knowledgeBase.weather.radiation.unshift( Number( weather.currentweather.solar ) );
					   
					   
					   self.knowledgeBase.weather.watervapourpressure = [];
					   $.each( self.knowledgeBase.weather.humidity,
						   function( key, val){
							   let T = self.knowledgeBase.weather.temperature[key];
							   let wvp = ( val * 0.01) * Math.exp( 18.965 - 4030/(T+235));	
							   self.knowledgeBase.weather.watervapourpressure.push( wvp );	
					   }); 
					   
					   self.saveSettings();
					   self.calcThermalIndices();
					   self.updateUI();
							  
					   // Only update when weather data has been received - and when external DB record is present.
					   if( self.knowledgeBase.user_info.hasExternalDBRecord ){
					   		addWeatherDataToDB(self.knowledgeBase);
					   }
					   else{
			   				showShortToast("cannot store weather on ClimApp server");
					   }
						
				   }
				   catch( error ){
					   console.log( error );
				   }
		}).fail(function( e ) {
				showShortToast("Failed to update weather.");
				console.log("fail in weather "+ e);
  		});

		// Schedule a notification if weather conditions are out of the ordinary
		// functionality will be extended to handle more complex scenarios - only when not in browser
		if(device.platform != 'browser') {
			var threshold = 0;
			if(self.knowledgeBase.weather.wbgt < threshold) {
				//let userWantsNotifications = self.knowledgeBase.user_info.receivesNotifications();
				//scheduleDefaultNotification(userWantsNotifications);
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
									"M": 		M(this.knowledgeBase), 	//W/m2 
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
			
			var Tg= self.knowledgeBase.weather.globetemperature[index];
			var Ta = self.knowledgeBase.weather.temperature[index];
			var va = self.knowledgeBase.weather.windspeed[index];
			var D = 0.15; //diameter black globe 
			var eps_g = 0.95; //standard emmisivity black bulb
			var Tmrt_mid = (1.1 * Math.pow(10,8) * Math.pow( va, 0.6 ) ) / (eps_g * Math.pow(D,0.4));
			
			var Tmrt = Math.pow( Math.pow((Tg+273.0), 4) + Tmrt_mid * (Tg-Ta), 0.25 ) - 273.0;
			options.air = {
							"Tair": self.knowledgeBase.weather.temperature[index], 	//C
							"rh": 	self.knowledgeBase.weather.humidity[index], 	//% relative humidity
							"Pw_air": self.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
							"Trad": Tmrt, 	//C mean radiant temperature
							"v_air": self.knowledgeBase.weather.windspeed[index], 	//m/s air velocity at 10m.
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
		/*
		this.knowledgeBase.thermalindices.ireq.sort(function(a,b){
			return new Date(a.utc) - new Date(b.utc);
		});
		this.knowledgeBase.thermalindices.phs.sort(function(a,b){
			return new Date(a.utc) - new Date(b.utc);
		});
		*/
			
	},
	updateUI: function(){
		// context dependent filling of content
		this.initNavbarListeners();
		
		if( this.currentPageID == "onboarding"){
			$(".navigation").hide();
		}
		else if( this.currentPageID == "dashboard" ){
			$(".navigation").show();
			$("#main_panel").show();
			$("#tip_panel").show();

			this.initGeolocationListeners();
			this.initActivityListeners();
			let selected = this.knowledgeBase.activity.selected;
			
			$("div[data-target='"+selected+"']").addClass("selected");
			let caption_ = this.knowledgeBase.activity.label[ selected ];
			$("#activityCaption").html( caption_ );
			
			/*
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
				let hrisk = WBGTrisk( wbgt, self.knowledgeBase );
				let crisk = obj.ICLminimal;
				let daydiffkey = daydiff;
				
				self.knowledgeBase.thermalindices.ireq[index].isnow = false;
				self.knowledgeBase.thermalindices.phs[index].isnow = false;
				if ( index == 0 ){
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
			if ( currentindex > -1){
				var base_val = this.determineThermalIndexValue( forecastarray[currentindex].cold, 
																forecastarray[currentindex].heat, 
																currentindex );
			
				var yesterday_val = undefined;
				var yesterday_string = "";
			
			    /*
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
					/*	
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
				$("#main_panel").hide();
				$("#tip_panel").hide();
				showShortToast("No weather data available");			
			}
			//$("#forecasts").html( forecasts );
			if( currentindex > -1 ){
				//this.initForecastListeners();
				console.log( currentindex );
				this.updateInfo( currentindex );
			}			
		    */
			this.updateInfo( 0 );
		}
		else if( this.currentPageID == "details"){
			$(".navigation").show();
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
			let heat_index = WBGTrisk( wbgt, this.knowledgeBase );
			
			let draw_cold_gauge = this.isDrawColdGauge( icl_min, heat_index, index );
			let draw_heat_gauge = this.isDrawHeatGauge( icl_min, heat_index, index );
			let tip_html = "";
			if( draw_cold_gauge || ( isNeutral && icl_min > heat_index ) ) {
				tip_html += coldLevelTips( index, 2, this.knowledgeBase );
			}
			else{
				tip_html += heatLevelTips( index, 2, this.knowledgeBase );
			}
			$("#moreinformation").html( tip_html );
			if( draw_cold_gauge ){
				$("div[data-context='heat'],div[data-context='neutral']").hide();
				$("div[data-context='cold']").show();
				
				let windchill = this.knowledgeBase.thermalindices.ireq[index].windchill.toFixed(1);
				let windrisk = windchillRisk( windchill );
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
				
				let minicon = clothingIcon( icl_min);
				let maxicon = clothingIcon( icl_max);
				
				$("#detail_min_clo").html("<img src='"+minicon+"' class='small'/>");
				$("#detail_max_clo").html("<img src='"+maxicon+"' class='small'/>");
				
				$("#detail_dle_ireq").html( dle_min );	
			}
			else if( draw_heat_gauge ){
				$("div[data-context='cold'],div[data-context='neutral']").hide();
				$("div[data-context='heat']").show();
				
				$("#detail_wbgt").html( wbgt );
				let ral = RAL(this.knowledgeBase).toFixed(1);
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
				$("div[data-context='neutral']").hide();
			}
		}
		else if( this.currentPageID == "settings" ){
			$(".navigation").show();
			this.initSettingsListeners();
			let unit = this.knowledgeBase.settings.unit.value;
			let height = this.knowledgeBase.settings.height.value;
			let weight = this.knowledgeBase.settings.weight.value;

			$("#age").html( this.knowledgeBase.settings.age.value + " " + this.knowledgeBase.settings.age.unit);
			$("#height").html( getCalculatedHeightValue(unit, height) + " " + getHeightUnit(unit));
			$("#weight").html( getCalculatedWeightValue(unit, weight) + " " + getWeightUnit(unit));
			$("#gender").html( this.knowledgeBase.settings.gender.value );
			$("#unit").html( this.knowledgeBase.settings.unit.value + " units" );
			$("#notification_checkbox").attr("checked", this.knowledgeBase.user_info.receivesNotifications);
		}
		else if( this.currentPageID == "feedback" ){
			$(".navigation").show();
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
		return cold >= heat
			   && 
			   cold >= this.knowledgeBase.thresholds.ireq &&
			   this.knowledgeBase.thermalindices.ireq[ index].Tair <= 15;
	},
	isDrawHeatGauge: function( cold, heat, index ){
 	   return heat > cold
		      && this.knowledgeBase.weather.wbgt[ index ] > 15;
	},
	determineThermalIndexValue: function( cold, heat, index ){
		let value = cold > heat ? -cold : heat;
		value = this.isDrawColdGauge( cold, heat, index ) ? -cold : value;
		value = this.isDrawHeatGauge( cold, heat, index ) ? heat : value;
		return Math.max( -4, Math.min( 4, value ) );//value between -4 and +4
	},
	updateInfo: function( index ){
		this.selectedWeatherID = index;
		if( this.knowledgeBase.thermalindices.ireq.length > 0 ){
			let distance = parseFloat( this.knowledgeBase.weather.distance ).toFixed(0);
			let utc_date = new Date( this.knowledgeBase.thermalindices.ireq[ index ].utc ); //
			let local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
					hour: '2-digit',
				    minute:'2-digit'
			});
			$("#current_time").html( local_time );
			$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
			$("#temperature").html( this.getTemperatureInPreferredUnit(this.knowledgeBase.thermalindices.ireq[ index].Tair).toFixed(0) +"&#xb0" );
			$("#windspeed").html( this.knowledgeBase.thermalindices.ireq[index].v_air.toFixed(0) );
			$("#temp_unit").html(getTemperatureUnit(this.knowledgeBase.settings.unit.value)); 
			$("#humidity").html(  this.knowledgeBase.thermalindices.ireq[index].rh.toFixed(0) );
		
			let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
			let cold_index = icl_min;
			let heat_index = WBGTrisk( this.knowledgeBase.thermalindices.phs[index].wbgt, this.knowledgeBase );
		
			let draw_cold_gauge = this.isDrawColdGauge( cold_index, heat_index, index );
			let draw_heat_gauge = this.isDrawHeatGauge( cold_index, heat_index, index );
		    let isNeutral = !draw_cold_gauge && !draw_heat_gauge;
			let tip_html = "";
			if( draw_cold_gauge || ( isNeutral && cold_index > heat_index ) ) {
				tip_html += coldLevelTips( index, 1, this.knowledgeBase );
			}
			else{
				tip_html += heatLevelTips( index, 1, this.knowledgeBase );
			}
			
			
			let windowsize = $( window ).width();
			let width = windowsize / 2;
		
			let value = this.determineThermalIndexValue( cold_index, heat_index, index );
			let thermal = draw_cold_gauge ? "cold" : "heat";
			
			console.log( "ci: " + cold_index + " hi: " + heat_index + " i: " + index);
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
		
		var title = key === "cold" ? gaugeTitleCold( Math.abs(value)) : gaugeTitleHeat( Math.abs(value));
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
};

app.initialize();