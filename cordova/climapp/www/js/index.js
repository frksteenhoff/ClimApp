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
	maxForecast: undefined,
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
		$("div[data-listener='submit']").on("click", function(){
			var target = $("#feedback_text").val();
			self.knowledgeBase.feedback.comment = target;
			
			// If user not in database, add user to database
			if(!self.knowledgeBase.user_info.hasExternalDBRecord) {
				self.knowledgeBase.user_info.hasExternalDBRecord = createUserRecord(self.knowledgeBase);
			} 
			// Add feedback to database
			addFeedbackToDB(self.knowledgeBase);
						
			// reset values
			$('#feedback_text').val("");

			// Load settings page
			self.loadUI('settings');
		});
	},
	initSettingsListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function(){
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
		$("div[data-listener='wheel']").on("swipeleft", function(){
			window.SelectorCordovaPlugin.hideSelector(); // hide selector so that it is not shown in dashboard (only working on iOS)
			self.loadUI("dashboard");
		});

		$("div[data-listener='tab']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='tab']").on("click", function(){
			var target = $(this).attr("data-target");
			
			if(target === "reset") {
				// Resetting values to default
				self.knowledgeBase.settings.age.value = 30;
				self.knowledgeBase.settings.gender.value = "undefined";
				self.knowledgeBase.settings.height.value = 178;
				self.knowledgeBase.settings.weight.value = 82;
				self.knowledgeBase.settings.unit.value = "SI";
				self.knowledgeBase.settings.acclimatization = false;
				self.knowledgeBase.user_info.receivesNotifications = false;

				self.saveSettings();
				self.updateUI();

				// Inform user about event in toast
				var notificationText = "Personal preferences reset, using default values.";
				showShortToast(notificationText);

			} else {
				self.loadUI(target);
			}
		});

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function(){
			var target = $(this).attr("data-target");
			
			if(target === "acclimatization_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.settings.acclimatization = isChecked;
				// Inform user about choice in toast
				var accText = isChecked ? "You are acclimatized to your working environment" : "You are not acclimatized to your working environment.";
				showShortToast(accText);

			} else if(target === "notification_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user_info.receivesNotifications = isChecked;
				// Inform user about choice in toast
				var notificationText = isChecked ? "You are receiving notifications!" : "You will not receive notifications.";
				showShortToast(notificationText);
			}
		});
		// Always add ability to swipe
		$("div[data-listener='tab']").on("swipeleft", function(){
			window.SelectorCordovaPlugin.hideSelector(); // hide selector so that it is not shown in dashboard
			self.loadUI("dashboard");
		});
	},
	initGeolocationListeners: function(){
		var self = this;
		$("div[data-listener='geolocation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='geolocation']").on("touchstart", function(){
			self.updateLocation();
		});		
	},
	initDashboardSwipeListeners: function() {
		var self = this;
		$("div[data-listener='panel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='panel']").on("swiperight", function(){
			var target = $(this).attr("data-target");
			if (target === "forecast"){
				
				if( self.selectedWeatherID === 0 ){
					self.updateLocation();
					$("#main_panel").fadeOut(2000, function(){});
				}
				else{
					self.selectedWeatherID = Math.max(0, self.selectedWeatherID-1);
					$("#main_panel").fadeOut(500, function(){
						self.updateInfo( self.selectedWeatherID );
					});
				}
			}else{
				self.loadUI(target);
			}
		});
		$("div[data-listener='panel']").on("swipeleft", function(){
			var target = $(this).attr("data-target");
			if (target === "forecast"){
				self.selectedWeatherID = Math.min( self.maxForecast, self.selectedWeatherID+1);
				$("#main_panel").fadeOut(500, function(){
					self.updateInfo( self.selectedWeatherID );
				});
			}
		});
	},
	initActivityListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			let title_ = self.knowledgeBase.activity.title;
			var items_ = self.getSelectables( target );
			
			var config = {
			    title: title_,
			    items:[ [ items_ ] ],
			    positiveButtonText: "Done",
			    negativeButtonText: "Cancel"
			};
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.activity.selected = items_[result[0].index].value;
				console.log( target + ": " + items_[result[0].index].value);
				self.saveSettings(); 
				self.calcThermalIndices();
				self.updateUI();
			}, function() {
			    console.log('Canceled');
			});
		} );
	},
	initMenuListeners: function(){
		var self = this;
		$("div[data-listener='menu']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='menu']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			$("div.menuitem").removeClass("menufocus");
			$(this).addClass("menufocus");
			
			//reset tab panels
			$("#selectactivity").removeClass("hidden").addClass("hidden");
			$("#selectclothing").removeClass("hidden").addClass("hidden");
			$("#selecthood").removeClass("hidden").addClass("hidden");
			$("#"+target).removeClass("hidden");
			
		});	
	},
	initKnowledgeBase: function(){
			return {"version": 1.96,
					"app_version": "beta",
					"user_info": {
							"isFirstLogin": 1,
							"introductionCompleted": 0, 
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
											}, // default SI units
									"acclimatization":  0,
					   },
					   "activity": { "title": "What is your activity",
						  			"description": {	"rest": "Resting, sitting at ease.\nBreathing not challenged.",
										 		"low":"Light manual work:\nwriting, typing, drawing, book-keeping.\nEasy to breathe and carry on a conversation.",
										 		"medium":"Walking 2.5 - 5.5km/h. Sustained arm and hand work: handling moderately heavy machinery, weeding, picking fruits.",
											 	"high":"Intense arm and trunk work: carrying heavy material, shovelling, sawing, hand mowing, concrete block laying.",
												"intense":"Very intense activity at fast maximum pace:\nworking with an ax, climbing stairs, running on level surface." 
									},
									"label": { "rest": "Rest", //ISO 8896
												"low": "Light",
												"medium": "Medium",
												"high": "High",
												"intense": "Intense"
									},
									"values": { "rest": 115.0, //ISO 8896
												"low": 180.0,
												"medium": 300.0,
												"high": 415.0,
												"intense": 520.0
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
		this.selectedWeatherID = 0;
		this.maxForecast = 8;
		//localStorage.clear(); // Need to clear local storage when doing the update
		var shadowKB = this.initKnowledgeBase();
		if ( localStorage.getItem("knowledgebase") !== null ) {
			
			this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase") );
			if ( 'version' in this.knowledgeBase && this.knowledgeBase.version < shadowKB.version ){
				this.knowledgeBase = this.initKnowledgeBase();
				console.log("knowledgebase updated to version : " + this.knowledgeBase.version );
				showShortToast("database updated to version : " + this.knowledgeBase.version);	
				this.knowledgeBase.user_info.isFirstLogin = 0; // If user has previous version, not first login
				this.knowledgeBase.user_info.hasExternalDBRecord = 1; // User must have DB record already
				this.saveSettings();
			}
			else if ('version' in this.knowledgeBase && this.knowledgeBase.version == shadowKB.version){
				console.log("loaded knowledgebase version : " + this.knowledgeBase.version );
				showShortToast("loaded database version : " + this.knowledgeBase.version);
				console.log("KB " + Object.keys(this.knowledgeBase));

			}
			else{ //old version does not have version key
				this.knowledgeBase = this.initKnowledgeBase();
				console.log("knowledgebase updated to version : " + this.knowledgeBase.version );
				showShortToast("database updated to version : " + this.knowledgeBase.version);
			}
		}
		else{
			this.knowledgeBase =this.initKnowledgeBase();	
			console.log("created knowledgebase version : " + this.knowledgeBase.version );
			showShortToast("created database version : " + this.knowledgeBase.version );
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
		else if( key === "windspeed" ){
			obj_array.push({description: "No wind", value: "No Wind" } );
			obj_array.push({description: "Some wind", value: "Some wind" } );
			obj_array.push({description: "Strong wind", value: "Strong wind" } );	
		}
		else if( key === "radiation" ){
			obj_array.push( {description: "Shadow", value: "Shadow"} );
			obj_array.push( {description: "Halfshadow", value: "Halfshadow" } );
			obj_array.push( {description: "Direct sunlight", value: "Direct sunlight" } );
			obj_array.push( {description: "Extreme radiation", value: "Extreme radiation" } );
		}
		else if( key === "clothing" ){
			obj_array.push({description: "Summer attire", value: "Summer attire"} );
			obj_array.push({description: "Overall", value: "Overall" } );
			obj_array.push({description: "Protective clothing", value: "Protective clothing" } );
			obj_array.push({description: "Winter attire", value: "Winter attire"} );
		}
		else if( key === "hood" ){
			obj_array.push({description: "None", value: "None" } );
			obj_array.push({description: "Hat", value: "Hat" } );
			obj_array.push({description: "Helmet", value: "Helmet"} );
		}
		else if (key === "activity"){
			obj_array.push({description: "Rest", value: "rest" } );
			obj_array.push({description: "Light activity", value: "low" } );
			obj_array.push({description: "Medium activity", value: "medium" } );
			obj_array.push({description: "High activity", value: "high" } );
			obj_array.push({description: "Intense activity", value: "intense" } );
			
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
			self.knowledgeBase.user_info.hasExternalDBRecord = createUserRecord(self.knowledgeBase);
		}
		var appidFromServer = await getAppIDFromDB(self.knowledgeBase); // Making code execution wait for app id retrieval


		if(self.knowledgeBase.user_info.hasExternalDBRecord && appidFromServer) { 
			console.log("Fetched app ID: " + appidFromServer);
		} else {
			//showShortToast("no external DB record found");			
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
					   console.log( weather );
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
					   
					   self.knowledgeBase.weather.wbgt = weather.wbgt_min.map(Number);
					   self.knowledgeBase.weather.wbgt.unshift( Number( weather.currentweather.wbgt_min ) );
					   
					   
					   self.knowledgeBase.weather.windchill = weather.windchill.map(Number);
					   self.knowledgeBase.weather.windchill.unshift( Number( weather.currentweather.windchill ) );
					   
					   
					   self.knowledgeBase.weather.temperature = weather.tair.map(Number);
					   self.knowledgeBase.weather.temperature.unshift( Number( weather.currentweather.tair ) );
					   

					   self.knowledgeBase.weather.globetemperature = weather.tglobe_clouds.map(Number);
					   self.knowledgeBase.weather.globetemperature.unshift( Number( weather.currentweather.tglobe_clouds ) );
					   
					   
					   self.knowledgeBase.weather.clouds = weather.clouds.map(Number);
					   self.knowledgeBase.weather.clouds.unshift( Number( weather.currentweather.clouds ) );
					   
					   
					   self.knowledgeBase.weather.humidity = weather.rh.map(Number);
					   self.knowledgeBase.weather.humidity.unshift( Number( weather.currentweather.rh ) );
					   
					   self.knowledgeBase.weather.rain = weather.rain.map(Number);
					   self.knowledgeBase.weather.rain.unshift( Number( weather.currentweather.rain ) );
					   
					   
					   self.knowledgeBase.weather.windspeed = weather.vair.map(Number);
					   self.knowledgeBase.weather.windspeed.unshift( Number( weather.currentweather.vair ) );
					    
					   
					   self.knowledgeBase.weather.radiation = weather.solar_clouds.map(Number);
					   self.knowledgeBase.weather.radiation.unshift( Number( weather.currentweather.solar_clouds ) );
					   
					   self.knowledgeBase.weather.meanradianttemperature = [];
					   self.knowledgeBase.weather.windspeed2m = [];
					   $.each( self.knowledgeBase.weather.windspeed, function(key, vair){
				   			var Tg= self.knowledgeBase.weather.globetemperature[key];
				   			var Ta = self.knowledgeBase.weather.temperature[key];
				   			var va = vair * Math.pow( 0.2, 0.25 ); //stability class D Liljgren 2008 Table 3
				   			
							//kruger et al 2014
							var D = 0.05; //diameter black globe (liljegren - ) --default value = 0.15
				   			var eps_g = 0.95; //standard emmisivity black bulb
				   			var t0 = (Tg+273.0);
				   			var t1 = Math.pow( t0, 4);
				   			var t2 = 1.1 * Math.pow(10,7) * Math.pow( va, 0.6 ); //Math.pow(10,8) seems typo?
				   			var t3 = eps_g * Math.pow( D, 0.4);
				   			var t4 = t1 + ( t2 / t3 ) * (Tg-Ta);
				   			var Tmrt = Math.pow( t4, 0.25 ) - 273.0;
							
							self.knowledgeBase.weather.meanradianttemperature.push( Tmrt );
							self.knowledgeBase.weather.windspeed2m.push( va );
					   } );
					   
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
			   				//showShortToast("cannot store weather on ClimApp server");
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
			options.air = {
							"Tair": self.knowledgeBase.weather.temperature[index], 	//C
							"rh": 	self.knowledgeBase.weather.humidity[index], 	//% relative humidity
							"Pw_air": self.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
							"Trad": self.knowledgeBase.weather.meanradianttemperature[index], 	//C mean radiant temperature
							"Tglobe": self.knowledgeBase.weather.globetemperature[index],
							"v_air": self.knowledgeBase.weather.windspeed2m[index], 	//m/s air velocity at 2m.
							"v_air10": self.knowledgeBase.weather.windspeed[index],  //m/s air velocity at 10m.
			};
			heatindex.IREQ.set_options( options );
			heatindex.IREQ.sim_run();

			var ireq = heatindex.IREQ.current_result();
			var ireq_object = {
				"ICLminimal": ireq.ICLminimal,
				"DLEminimal": ireq.DLEminimal,
				"ICLneutral": ireq.ICLneutral,
				"DLEneutral": ireq.DLEneutral,
				"M":options.body.M,
				"Icl":options.cloth.Icl,
				"p":options.cloth.p,
				"im_st": options.cloth.im_st,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air, //@2m
				"v_air10": options.air.v_air10, //@10m
				"Trad":options.air.Trad,
				"Tglobe": options.air.Tglobe,
				"clouds": self.knowledgeBase.weather.clouds[index],
				"rain": self.knowledgeBase.weather.rain[index],
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
				"M":options.body.M,
				"Icl":options.cloth.Icl,
				"p":options.cloth.p,
				"im_st": options.cloth.im_st,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air, //@2m
				"v_air10": options.air.v_air10, //@10m
				"Trad":options.air.Trad,
				"Tglobe": options.air.Tglobe,
				"clouds": self.knowledgeBase.weather.clouds[index],
				"rain": self.knowledgeBase.weather.rain[index],
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
		$(".navigation_back_settings").hide();
		$(".navigation_back_dashboard").hide();
		
		if( this.currentPageID == "onboarding"){
			$(".navigation").hide();
		}
		else if( this.currentPageID == "dashboard" ){
			$(".navigation").show();
			$("#main_panel").show();
			$("#tip_panel").show();

			this.initDashboardSwipeListeners();
			this.initGeolocationListeners();
			this.initActivityListeners();
			this.initMenuListeners();
			
			let selected = this.knowledgeBase.activity.selected;			
			$("#dashboard_activity").html( this.knowledgeBase.activity.label[ selected ] );
			let caption_ = this.knowledgeBase.activity.description[ selected ];
			$("#activityCaption").html( caption_ );
			
			selected = this.knowledgeBase.activity.selected;			
			$("#dashboard_clothing").html( this.knowledgeBase.activity.label[ selected ] );
			 caption_ = this.knowledgeBase.activity.description[ selected ];
			$("#clothingCaption").html( caption_ );
			
			selected = this.knowledgeBase.activity.selected;			
			$("#dashboard_headgear").html( this.knowledgeBase.activity.label[ selected ] );
			 caption_ = this.knowledgeBase.activity.description[ selected ];
			$("#headgearCaption").html( caption_ );
			
			
			
			
			this.updateInfo( this.selectedWeatherID );

			// Giving the user an introduction of the dashbord on first login
			console.log("INTRO: " + this.knowledgeBase.user_info.introductionCompleted);
			if(!this.knowledgeBase.user_info.introductionCompleted) {
				startIntro();
				this.knowledgeBase.user_info.introductionCompleted = 1;
				this.saveSettings();
			}
		}
		else if( this.currentPageID == "details"){
			$(".navigation").hide();
			$(".navigation_back_dashboard").show();
			var index = this.selectedWeatherID;
			
			let tair = this.knowledgeBase.thermalindices.phs[index].Tair.toFixed(1);
			let rh = this.knowledgeBase.thermalindices.phs[index].rh.toFixed(0);
			let clouds = this.knowledgeBase.thermalindices.phs[index].clouds.toFixed(0);
			
			let rad = this.knowledgeBase.thermalindices.phs[index].rad.toFixed(0);
			let vair10 = this.knowledgeBase.thermalindices.phs[index].v_air10.toFixed(1);
			let vair2 = this.knowledgeBase.thermalindices.phs[index].v_air.toFixed(1);
			let tmrt = this.knowledgeBase.thermalindices.phs[index].Trad.toFixed(1);
			let tglobe = this.knowledgeBase.thermalindices.phs[index].Tglobe.toFixed(1);
			
			let wbgt = this.knowledgeBase.thermalindices.phs[index].wbgt.toFixed(1);
			let windchill = this.knowledgeBase.thermalindices.phs[index].windchill.toFixed(1);
			
			let M = this.knowledgeBase.thermalindices.phs[index].M.toFixed(0);
			let A = BSA( this.knowledgeBase ).toFixed(1);
			
			let Icl = 0.155 * this.knowledgeBase.thermalindices.phs[index].Icl.toFixed(3);
			let p = this.knowledgeBase.thermalindices.phs[index].p.toFixed(2);
			let im = this.knowledgeBase.thermalindices.phs[index].im_st.toFixed(2);
			
			
			let utc_date = new Date( this.knowledgeBase.thermalindices.ireq[ index ].utc ); //
			let local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
					hour: '2-digit',
				    minute:'2-digit'
			});
			
			$("#detail_time").html(local_time);
			
			$("#detail_airtemp").html(tair + "&deg;C");
			$("#detail_rh").html(rh + "%");
			$("#detail_clouds").html(clouds + "%");

			$("#detail_wind10m").html(vair10 + "m/s");
			
			$("#detail_wind2m").html(vair2 + "m/s");
			$("#detail_mrt").html(tmrt + "&deg;C");
			$("#detail_tglobe").html(tglobe + "&deg;C");
			$("#detail_rad").html(rad + "W/m<sup>2</sup>");
			$("#detail_wbgt").html(wbgt + "&deg;C");
			$("#detail_windchill").html(windchill + "&deg;C");
			
			
			$("#detail_metabolic").html(M + "W/m<sup>2</sup>");
			$("#detail_area").html(A + "m<sup>2</sup>")
			
			$("#detail_icl").html(Icl + "m<sup2</sup>K/W");
			$("#detail_p").html(p);
			$("#detail_im").html(im);
			
			
			
			
			let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
			let heat_index = WBGTrisk( wbgt, this.knowledgeBase );
			
			let draw_cold_gauge = this.isDrawColdGauge( icl_min, heat_index, index );
			let draw_heat_gauge = this.isDrawHeatGauge( icl_min, heat_index, index );
		    let isNeutral = !draw_cold_gauge && !draw_heat_gauge;
			
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
				
				let d_tre = this.knowledgeBase.thermalindices.phs[ index].D_Tre ? this.knowledgeBase.thermalindices.phs[ index].D_Tre : ">120";
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
			$("#acclimatization_checkbox").attr("checked", this.knowledgeBase.settings.acclimatization);
			$("#notification_checkbox").attr("checked", this.knowledgeBase.user_info.receivesNotifications);
		}
		else if( this.currentPageID == "feedback" ){
			$(".navigation").hide();
			$(".navigation_back_settings").show();
			this.initFeedbackListeners();
			// Question text
			$("#question1").html( this.knowledgeBase.feedback.question1.text );
			$("#question2").html( this.knowledgeBase.feedback.question2.text );
			$("#question3").html( this.knowledgeBase.feedback.question3.text );

			// Set rating bar text (under feedback buttons) using last given feedback
			$("#ratingtext1").html( this.knowledgeBase.feedback.question1.ratingtext[this.knowledgeBase.feedback.question1.rating] );
			$("#ratingtext2").html( this.knowledgeBase.feedback.question2.ratingtext[this.knowledgeBase.feedback.question2.rating] );
			$("#ratingtext3").html( this.knowledgeBase.feedback.question3.ratingtext[this.knowledgeBase.feedback.question3.rating] );

			// Rating bar values -- still not setting the default color..
			$("input[id='1star"+this.knowledgeBase.feedback.question1.rating+"']").attr("checked", true);
			$("input[id='2star"+this.knowledgeBase.feedback.question2.rating+"']").attr("checked", true);
			$("input[id='3star"+this.knowledgeBase.feedback.question3.rating+"']").attr("checked", true);
		} 
		else if(this.currentPageID == "about") {
			$(".navigation").hide();
			$(".navigation_back_settings").show(); //BK: class used as id - consider using id - #navigation_back_settings instead of .
			$("#app_version").html("App version: " + this.knowledgeBase.app_version);
			$("#kb_version").html("Knowledgebase version: " + this.knowledgeBase.version);
		} 
		else if (this.currentPageID == "disclaimer") {
			$(".navigation").hide();
			$(".navigation_back_settings").show();
		}
	},
	isDrawColdGauge: function( cold, heat, index ){
		return cold >= heat
			   && 
			   cold >= this.knowledgeBase.thresholds.ireq &&
			   this.knowledgeBase.thermalindices.ireq[ index].Tair <= 10;
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
			
			let next = index + 1;
			let prev = index - 1;
			
			let cDate = new Date();
			let cDaynumber = cDate.getDate();
			let cMonthnumber = cDate.getMonth();
			let cYearnumber = cDate.getYear();
			
			
			if( prev < 0 ){
				$("#swipe_left_time").html( "update weather");
			}
			else{
				$("#forecast_left").show();
				
				let prev_utc_date = new Date( this.knowledgeBase.thermalindices.ireq[ prev ].utc ); //
				let prev_local_time = prev_utc_date.toLocaleTimeString(navigator.language, { //language specific setting
						hour: '2-digit',
					    minute:'2-digit'
				});
				if( prev_utc_date.getDate() > cDaynumber || 
					prev_utc_date.getMonth() > cMonthnumber || 
					prev_utc_date.getYear() > cYearnumber ){
					
						prev_local_time = "tomorrow " + prev_local_time;
				}
				$("#swipe_left_time").html(prev_local_time);
			}
			
			if( next > this.maxForecast ){
				$("#forecast_right").hide();
			}
			else{
				$("#forecast_right").show();
				
				let next_utc_date = new Date( this.knowledgeBase.thermalindices.ireq[ next ].utc ); //
				let next_local_time = next_utc_date.toLocaleTimeString(navigator.language, { //language specific setting
						hour: '2-digit',
					    minute:'2-digit'
				});
				if( next_utc_date.getDate() > cDaynumber || 
					next_utc_date.getMonth() > cMonthnumber || 
					next_utc_date.getYear() > cYearnumber ){
					
						next_local_time = "tomorrow " + next_local_time;
				}
				$("#swipe_right_time").html(next_local_time);
			}
			
			
			$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
			
			$("#temperature").html( this.knowledgeBase.thermalindices.ireq[ index].Tair.toFixed(0) +"&#xb0");
			
			let ws = this.knowledgeBase.thermalindices.ireq[index].v_air10 * 3.6; //m/s to km/h
			$("#windspeed").html( ws.toFixed(0) );
			$("#temp_unit").html(getTemperatureUnit(this.knowledgeBase.settings.unit.value)); 
			$("#humidity").html(  this.knowledgeBase.thermalindices.ireq[index].rh.toFixed(0) );
			
			//weather icon
			let clouds = this.knowledgeBase.thermalindices.ireq[index].clouds;
			let rain = this.knowledgeBase.thermalindices.ireq[index].rain;
			let solar = this.knowledgeBase.thermalindices.ireq[index].solar;
			let icon_weather = "fa-cloud-sun-rain";
			if( solar > 0 ){ //daytime
				
				if( clouds < 10 ){                    //sun
					icon_weather = "fa-sun";
				}
				else if( clouds < 80 && rain < 0.1 ){ //clouds sun no rain
					icon_weather = "fa-cloud-sun";
				}
				else if( clouds >= 80 && rain < 0.1 ){ //clouds no rain
					icon_weather = "fa-cloud";
				} 
				else if( clouds < 80 && rain > 0.1 ){  //cloud sun rain
					icon_weather = "fa-cloud-sun-rain";
				}
				else if( clouds >= 80 && rain > 0.1 ){  //cloud  rain
					icon_weather = "fa-cloud-rain";
				}
				else if( clouds >= 80 && rain > 1 ){  //cloud  rain
					icon_weather = "fa-cloud-showers-heavy";
				}
			}
			else{ //night
				if( clouds < 10 ){                    //moon
					icon_weather = "fa-moon";
				}
				else if( clouds < 80 && rain < 0.1 ){ //clouds moon no rain
					icon_weather = "fa-cloud-moon";
				}
				else if( clouds >= 80 && rain < 0.1 ){ //clouds no rain
					icon_weather = "fa-cloud";
				} 
				else if( clouds < 80 && rain > 0.1 ){  //cloud moon rain
					icon_weather = "fa-cloud-moon-rain";
				}
				else if( clouds >= 80 && rain > 0.1 ){  //cloud  rain
					icon_weather = "fa-cloud-rain";
				}
				else if( clouds >= 80 && rain > 1 ){  //cloud  rain
					icon_weather = "fa-cloud-moon-rain";
				}
			}
			$("#icon-weather").removeClass().addClass("fas").addClass(icon_weather);
		    
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
			let width = windowsize / 2.5;
			let value = this.determineThermalIndexValue( cold_index, heat_index, index );
			let thermal = draw_cold_gauge ? "cold" : "heat";
			
			this.drawGauge( 'main_gauge', width, value , thermal );
			
			$("#tips").html( tip_html ); 
			$("#circle_gauge_color").css("color", getCurrentGaugeColor(value));
			$("#main_panel").fadeIn(500);
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
};

app.initialize();
