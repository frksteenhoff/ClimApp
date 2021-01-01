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
	language: undefined,
	translations: undefined,
	knowledgeBase: undefined,
	pageMap: undefined,
	currentPageID: undefined,
	currentProfile: undefined,
	currentThermal: undefined,
	selectedWeatherID: undefined,
	maxForecast: undefined,
	radialgauge: undefined,
	showExpertLegend: undefined,

	// Application Constructor
	initialize: function () {
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		//this.onDeviceReady(); //call this to run on browser, as browser does not fire the event by itself.
	},

	// deviceready Event Handler
	//
	// Bind any cordova events here. Common events are:
	// 'pause', 'resume', etc.
	onDeviceReady: function () {
		window.onerror = function (message, url, lineNumber) {
			console.log("Error: " + message + " in " + url + " at line " + lineNumber);
			showShortToast("Whoops... something went wrong at: " + lineNumber);
		}
		this.receivedEvent('deviceready');
	},

	// Update DOM on a Received Event
	receivedEvent: function (id) {
		var self = this;
		// Read in feedback questions (asynchronously)
		$.getJSON("data/feedbackQuestions.json", function (json) {
			try {
				console.log("Feedback questions read: " + Object.keys(json));
			} catch (error) {
				console.log("Error in reading feedback questions: " + error);
			}
			}).fail(function (e) {
				console.log("Failed to read feedbackquestions " + JSON.stringify(e));
				// Read in translations (synchronously)
				self.loadTranslations("http://www.sensationmapps.com/climapp/translations.php?f=translations");
			}).done(function (result){
				self.feedback_questions = result;
				// Read in translations (synchronously)
				self.loadTranslations("http://www.sensationmapps.com/climapp/translations.php?f=translations");
		});
	},
	loadTranslations: function( url ){
		var self = this;
		console.log("translations fetch attempt: " + url );
		$.getJSON( url, function (json) {
			try {
				console.log("Translations read from : "+url+" - " + Object.keys(json));
			} catch (error) {
				console.log("Error in reading translations: " + error);
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.log("Failed to read translations " + JSON.stringify(jqXHR));
			self.loadTranslations("./translations/translations.json");
		// Load settings after translations have been read
		}).done(function (result) {
			self.translations = result;
			self.loadSettings();
			
			
			if (self.knowledgeBase.user.guards.isFirstLogin) {//onboarding
				self.loadUI("onboarding", "startintro");
			}
			else {
				self.loadUI("home", "none");
			}
			
			// Keeping track of how many time user has opened app, until count reaches 5
			//functionality removed dec 2020 by BK - argument: user can go to details for more details - otherwise all info on same level
			
			// After 5 times opening the app, the user is seen as advanced
			//if (self.knowledgeBase.user.settings.level !== 2 && self.knowledgeBase.user.guards.appOpenedCount === 5) {
				self.knowledgeBase.user.settings.level = 2;
			//	showShortToast(self.translations.toasts.adv_user[self.language]); // Showing how to call translation text for toasts
			//}
			
			if( !self.knowledgeBase.user.guards.customLocationEnabled ){
				self.updateLocation();
			}
			else{
				self.updateWeather();
			}
			
		});
	},
	initNavbarListeners: function () {
		// navigation menu
		var self = this;
		$("div[data-listener='navbar']").off();
		$("div[data-listener='navbar']").on("click", function () {
			let target = $(this).attr("data-target");
			
			self.knowledgeBase.user.guards.isFirstLogin = 0; //find better location for this logic - it is now obsolete because we do not have an onboarding screen anymore
			self.saveSettings();
			
			var action = $(this).attr("data-action");
			var afteraction = typeof action !== 'undefined' ? action : "none";
			
			self.loadUI(target, afteraction );
		});
	},
	initErrorListeners: function() {
		var self = this;
		$("div[data-listener='weather_error']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='weather_error']").on("click", function () {
			let target = $(this).attr("data-target");
			self.updateLocation();
			self.loadUI(target, "none");			
		});
	},
	initPerceptionListeners: function(){
		var self = this;
		$("input[data-listener='perception']").off();
		$("input[data-listener='perception']").on("change", function () {

			var mode = $(this).attr("data-mode");
						
			self.knowledgeBase.user.adaptation.mode = mode;
			
			var val = $(this).val();
			self.knowledgeBase.user.adaptation[mode].perceived = val;
			
			var predicted = $(this).attr("data-predicted");
			self.knowledgeBase.user.adaptation[mode].predicted = predicted;
			
			if( Array.isArray( self.knowledgeBase.user.adaptation[mode].diff ) ){
				self.knowledgeBase.user.adaptation[mode].diff.push( val );
			}
			else{
				self.knowledgeBase.user.adaptation[mode].diff = [ val ]; 
			}
			
			self.saveSettings();
			self.updateUI();
			
		});
	},
	initFeedbackListeners: function () {
		var self = this;
		
		// When user rates the feedback questions
		$("input[data-listener='feedback']").off();
		$("input[data-listener='feedback']").on("click", function () {
			var target = $(this).attr("data-target");
			console.log("target: " + target);

			// Updating rating bar using first char in ID
			var rating_id = $(this).attr("id")[0];

			if (rating_id === '1') {
				self.knowledgeBase.feedback.question1 = target + ".0"; // this is how the integers in feedback are read from the translations sheet "x.0" 
				$("#ratingtext1").html(self.translations.feedback.question1.ratingtext[self.knowledgeBase.feedback.question1][self.language]);
			} else if (rating_id === '2') {
				self.knowledgeBase.feedback.question2 = target + ".0";
				$("#ratingtext2").html(self.translations.feedback.question2.ratingtext[self.knowledgeBase.feedback.question2][self.language]);
			} else {
				self.knowledgeBase.feedback.question3 = target + ".0";
				$("#ratingtext3").html(self.translations.feedback.question3.ratingtext[self.knowledgeBase.feedback.question3][self.language]);
			}
			$("input[data-listener='feedback']").removeClass("checked");
			self.saveSettings();
		});

		// When user submits feedback, add to object to send to db + reset values
		$("div[data-listener='submit']").off();
		$("div[data-listener='submit']").on("click", function () {
			var target = $("#feedback_text").val();
			let mode = self.knowledgeBase.user.adaptation.mode;

			self.translations.feedback.comment = target;

     		self.feedback_questions.comment = target;

			// If user not in database, add user to database
			self.checkIfUserExistInDB();

			// Add feedback to database
			addFeedbackToDB(self.knowledgeBase, self.feedback_questions, self.translations, self.language);

			// Load settings page
			self.loadUI('settings', "none");
		});
	},
	initSettingsListeners: function () {
		var self = this;
		console.log("initSettingsListeners");
		$("input[data-listener='slider']").off(); // this type of slider expects a key value
		$("input[data-listener='slider']").on("change", function(event ){
						
			var selected = parseInt( $(this).val() );
			var target = $(this).attr("data-target");
			
			var keys = Object.keys( self.knowledgeBase[target].values );
			self.knowledgeBase.user.settings[ target + "_selected"] = keys[ selected ];
			if( target == "clothing"){
				self.knowledgeBase.user.settings.insulation_selected = self.knowledgeBase.clothing.values[ keys[ selected ] ].Icl;
				self.knowledgeBase.user.settings.windpermeability_selected = self.knowledgeBase.clothing.values[ keys[ selected ] ].p;
				self.knowledgeBase.user.settings.vapourpermeability_selected = self.knowledgeBase.clothing.values[ keys[ selected ] ].im;
			}
			
			self.saveSettings();
			
			self.calcThermalIndices();
			
			self.updateUI();
			
		});
		
		$("input[data-listener='valueslider']").off(); // this type of directly inputs a value
		$("input[data-listener='valueslider']").on("change", function(event ){
			var value = parseFloat( $(this).val() ) ;
			var target = $(this).attr("data-target");
			
			self.knowledgeBase.user.settings[ target + "_selected"] = value;
			self.saveSettings();
			self.calcThermalIndices();
			self.updateUI();
		});
		
		
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function () {
			var target = $(this).attr("data-target");
			let title_ = self.translations.wheels.settings[target].title[self.language];
			var items_ = self.getSelectables(target);
			var currentValueAsString = getWheelStartingValueSettings(target, self.knowledgeBase, self.translations, self.language);

			var config = {
				title: title_,
				items: [[items_]],
				positiveButtonText: self.translations.labels.str_done[self.language],
				negativeButtonText: self.translations.labels.str_cancel[self.language],
				defaultItems: {"0": currentValueAsString}, 
				wrapWheelText: true
			};
			window.SelectorCordovaPlugin.showSelector(config, function (result) {
				if (["gender", "height", "weight", "unit"].includes(target)) {
					self.knowledgeBase.user.settings[target] = items_[result[0].index].value;
					updateDBParam(self.knowledgeBase, target);

				} else if(target === "age") {
					// Set age based on year of birth
					self.knowledgeBase.user.settings[target] = getAgeFromYearOfBirth(items_[result[0].index].value);
					self.knowledgeBase.user.settings.yearOfBirth = items_[result[0].index].value;
					updateDBParam(self.knowledgeBase, target);
				}
				self.calcThermalIndices();
				self.saveSettings();
				console.log(target + ": " + items_[result[0].index].value);
				self.updateUI();
			}, function () {
				console.log('Canceled');
			});
		});

		$("div[data-listener='tab']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='tab']").on("click", function () {

			var target = $(this).attr("data-target");
			var action = $(this).attr("data-action");
			
			var afteraction = typeof action !== 'undefined' ? action : "none";
			
			console.log(target);
			if (target === "reset") {
				// Resetting values to default
				self.knowledgeBase.user.settings.age = 30;
				self.knowledgeBase.user.settings.yearOfBirth = 1990;
				self.knowledgeBase.user.settings.gender = "undefined";
				self.knowledgeBase.user.settings.height = 178;
				self.knowledgeBase.user.settings.weight = 82;
				self.knowledgeBase.user.settings.unit = "SI";
				self.knowledgeBase.user.settings.acclimatization = false;
				self.knowledgeBase.user.guards.receivesNotifications = false;

				self.saveSettings();
				self.updateUI();

				// Inform user about event in toast
				showShortToast(self.translations.toasts.preferences_reset[self.language]);
			}
			else {
				self.loadUI(target, afteraction);
			}
		});

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function () {
			var target = $(this).attr("data-target");

			if (target === "acclimatization_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.settings.acclimatization = isChecked;
				// Inform user about choice in toast
				var accText = isChecked ? self.translations.toasts.acclimatized[self.language] : self.translations.toasts.not_acclimatized[self.language];
				updateDBParam(self.knowledgeBase, "acclimatization");
				showShortToast(accText);
				self.updateUI();
			} else if (target === "notification_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.guards.receivesNotifications = isChecked;
				// Inform user about choice in toast
				var notificationText = isChecked ? self.translations.toasts.notification_enabled[self.language] : self.translations.toasts.notification_disabled[self.language];
				showShortToast(notificationText);
			}
			self.saveSettings();
		});
	},
	initLocationListeners: function () {
		var self = this;

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function () {
			var target = $(this).attr("data-target");

			var customText = "";
			var isChecked = $(this).is(":checked");
			if (target === "custom_location_switch") {
				if (isChecked) {
					self.knowledgeBase.user.guards.isIndoor = false;
					customText = self.translations.toasts.location_enabled[self.language];
					var [lat, lon] = getLocation(self.knowledgeBase);
					console.log("fading in google map");
					$("#google_maps_elem").fadeIn(100, function(){
						console.log("initializing google map");
						initMap(lat,lon, self.knowledgeBase);
						console.log("after initializing google map");
						
					});
				} else {
					customText = self.translations.toasts.location_disabled[self.language];
					$("#google_maps_elem").fadeOut(100, function(){});
					self.updateLocation();
				}
				self.knowledgeBase.user.guards.customLocationEnabled = isChecked;
				
			}
			showShortToast(customText);
			self.saveSettings();
		});

		$("div[data-listener='set_coordinates']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='set_coordinates']").on("click", function () {
			self.saveSettings();
			self.updateWeather();
			var	customText = self.translations.toasts.custom_location[self.language] + ": ";
			customText +=  self.knowledgeBase.user.settings.coordinates_lat.toFixed(4) + ", " + self.knowledgeBase.user.settings.coordinates_lon.toFixed(4);
			self.loadUI("home", "none");
			showShortToast(customText);
		});
	},
	initIndoorListeners: function () {
		var self = this;
		$("div[data-listener='wheel'],div[data-context='indoor']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel'],div[data-context='indoor']").on("click", async function () {
			var target = $(this).attr("data-target");
			let title_ = self.translations.wheels.settings[target].title[self.language];
			var items_ = self.getSelectables(target);
			var currentValueAsString = getWheelStartingValueIndoor(target, self.knowledgeBase, self.translations, self.language);

			var config = {
				title: title_,
				items: [[items_]],
				positiveButtonText: self.translations.labels.str_done[self.language],
				negativeButtonText: self.translations.labels.str_cancel[self.language],
				defaultItems: {"0": currentValueAsString}
			};

			window.SelectorCordovaPlugin.showSelector(config, function (result) {
				self.knowledgeBase.user.settings[target] = items_[result[0].index].value;
				
				if( target==="_temperature" || target==="_humidity" ){ //update on callback - so user has feedback on action - also if DTU server is down.
					$("#"+target).html( self.knowledgeBase.user.settings[target] );
					self.calcThermalIndices();
					self.updateUI();
				}
				
				else{
					self.calcThermalIndices();
					self.updateIndoorPrediction();
				}
				
			}, function () {
				console.log('Canceled');
			});
		});
	},
	initGeolocationListeners: function () {
		var self = this;
		$("div[data-listener='geolocation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='geolocation']").on("click", function () {
			self.updateLocation();
		});
	},
	initDashboardListeners: function () {
		var self = this;
		$("div[data-listener='tab']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='tab']").on("click", function () {
			var target = $(this).attr("data-target");
			// Load feedback page when pressing gauge in dashboard
			self.loadUI(target, "none");
		});
	},
	initActivityListeners: function () {
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function () {
			var target = $(this).attr("data-target");
			let title_ = self.translations.wheels[target].title[self.language];
			console.log("target: " + target + " title " + title_);
			var items_ = self.getSelectables(target);
			var currentValueAsString = self.translations.wheels[target].label[self.knowledgeBase.user.settings[target+"_selected"]][self.language];
		
			var config = {
				title: title_,
				items: [[items_]],
				positiveButtonText: self.translations.labels.str_done[self.language],
				negativeButtonText: self.translations.labels.str_cancel[self.language],
				defaultItems: {"0": currentValueAsString}
			};
			window.SelectorCordovaPlugin.showSelector(config, function (result) {
				self.knowledgeBase.user.settings[target + "_selected"] = items_[result[0].index].value;
				console.log(target + ": " + items_[result[0].index].value);
				self.saveSettings();
				self.calcThermalIndices();
				self.updateUI();
			}, function () {
				console.log('Canceled');
			});
		});
	},
	initResearchListeners: function () {
		var self = this;
		$("div[data-listener='submit']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='submit']").on("click", function () {
			addUseDataToDB( self.knowledgeBase, self );
			self.loadUI("home","none");
		});
	},
	initMenuListeners: function () {
		var self = this;
		$("div[data-listener='menu']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='menu']").on("click", function () {
			var target = $(this).attr("data-target");
			var targetgroup = $(this).attr("data-targetgroup");
			
			//remove hide all targetgroup
			$("div[data-menuitem='true']div[data-menugroup='"+targetgroup+"']").removeClass("hidden").addClass("hidden");
			

			if( $(this).hasClass("menufocus") ){ //remove focus on which has focus
				$("div[data-listener='menu']div[data-targetgroup='"+targetgroup+"']").removeClass("menufocus");	
			}
			else{ //remove hidden on targetgroup (show - and give target focus)
				$("div[data-listener='menu']div[data-targetgroup='"+targetgroup+"']").removeClass("menufocus");
				$(this).addClass("menufocus");
				$("#" + target).removeClass("hidden");
			}
			
			if( target === "selectutci" ){
				if( self.knowledgeBase.thermalindices.utci.length == self.maxForecast ){
					self.knowledgeBase.user.settings.index = "UTCI";
				}
				else{
					showShortToast("UTCI unavailable");
				}
			}
			else if( target === "selectmyself"){
				self.currentProfile = "personal";
			}
			else if( target === "selectseniors"){
				self.currentProfile = "seniors";
			}
			else if( target === "selectchildren"){
				self.currentProfile = "children";
			}
			else if( target === "selectindoor" ){
				self.knowledgeBase.user.guards.isIndoor = true;
			}
			else if( target === "selectoutdoor"){
				$("div[data-listener='wheel'],div[data-context='indoor']").off(); //stop listening for indoor events
				self.knowledgeBase.user.guards.isIndoor = false;
			}
			else if( target === "ruleslegend" ){
				self.showExpertLegend = !self.showExpertLegend;
			}
			else{
				$("#selectwork").show();
				$("#selectmeasuresandhydration").show();
				$("#personalisation_item").show();
				self.knowledgeBase.user.settings.index = "Climapp";
			}
			
			if( targetgroup === "modelgroup" ||
				targetgroup === "profilegroup" ||
				targetgroup === "modegroup" ||
				targetgroup === "rulesgroup" ||
				targetgroup === "targetgroupgroup" ){
				self.updateUI();
			}
			else{
				self.initSettingsListeners();
			}
			
		});
	},
	initKnowledgeBase: function () {
		return {
			/* --------------------------------------------------- */
			// Should not be overwritten!
			"user": {
				"guards": {
					"isFirstLogin": 1,
					"introductionCompleted": 0,
					"hasExternalDBRecord": 0,
					"receivesNotifications": 0, // false as notifications are not part of the app
					"appOpenedCount": 0, // number of times user has opened app
					"feedbackSliderChanged": 0,
					"customLocationEnabled": false,
					"isIndoor": false
				},
				"settings": { // Using default values
					"yearOfBirth" : 1990,
					"age": 30,
					"height": 178,
					"weight": 82,
					"gender": "undefined",
					"unit": "SI",
					"acclimatization": false,
					"activity_selected": "medium",
					"clothing_selected": "Summer_attire",
					"headgear_selected": "none",
					"insulation_selected": 0.5,//clo
					"windpermeability_selected": 50,//clo
					"vapourpermeability_selected": 0.38,//clo
					"vapourbarrier_selected": false,
					"windstopper_selected": false,
					"gloves_selected": false,
					"explore": false, // currently not used
					"level": 1, // 1 - beginner, 2 - advanced

					/* Indoor mode */
					"thermostat_level": 3,
					"open_windows": 0,
					"_temperature": 21, // indoor temperature
					"windspeed": 1, // 1 no_wind, 2 some_wind, 3 strong_wind
					"_humidity": 50,

					"temp_indoor_predicted": 21, // predicted indoor temp, false on error, otherwise double
					"humidity_indoor_predicted": 50, //humidity predicted
					/* Custom location */
					"coordinates_lon": 0,
					"coordinates_lat": 0,
					"station": "Unknown",
					
					/* preferred index*/
					"index": "Climapp"
				},
				"adaptation": {
					"mode": "undefined",
					"heat": {
						"predicted": 0,//deprecated to be removed
						"perceived": 0,//deprecated to be removed
						"diff": [0] // perceived - predicted
					},
					"cold": {
						"predicted": 0,//deprecated to be removed
						"perceived": 0,//deprecated to be removed
						"diff": [0] // perceived - predicted
					}
				}
			},
			/* --------------------------------------------------- */
			"version": 2.10,
			"app_version": "5.0.2", //cannot be beta - because it will be rejected by iOS then.
			"server": {
				"dtu_ip": "http://climapp.byg.dtu.dk",
				"dtu_api_base_url": "/ClimAppAPI/v2/ClimAppApi.php?apicall="
			},
			"position": {
				"lat": 0,
				"lng": 0,
				"timestamp": "",
			},
			"weather": {
				"station": "",
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
			"activity": {
				// Dependent on correct translation sheet labels (rest, low, medium, high, intense)
				"values": {
					"rest": {i:0, val:115.0}, //ISO 8896
					"low": {i:1, val:180.0},
					"medium": {i:2, val:300.0},
					"high": {i:3, val:415.0},
					"intense": {i:4, val:520.0}
				}
			},
			"clothing": {
				"values": {
					"Summer_attire": { i:0, Icl: 0.5, p: 200.0, im: 0.45, CAV: -3 },  //clo
					"Casual_business": { i:1, Icl: 0.8, p: 100.0, im: 0.38, CAV: 0 },
					"Business_suit": { i:2, Icl: 1.0, p: 50, im: 0.38, CAV: 0 },
					"Double_layer": { i:3, Icl: 1.5, p: 10, im: 0.38, CAV: 0 },
					//"Cloth_coverall": 1.0,
					//"Cloth_apron_long_sleeve": 1.2,
					//"Vapour_barrier_coverall": 1.1,
					"Winter_attire": { i:4, Icl: 2.5, p: 5, im: 0.38, CAV: 0 },
				}
			},
			"feedback": {
				"question1": 0,
				"question2": 0,
				"question3": 0,
				"comment": ""
			},
			"headgear": {
				"values": {
					"none": 0, //clo
					"helmet": 0.1, //clo
				}
			},
			"thermalindices": {
				"ireq": [],
				"phs": [],
				"pmv": [],
				"utci": [],
			},
			"gauge": {
				"highlights": [//color also in CSS, keep consistent
					{ from: 3, to: 4, color: 'rgba(150,0,0,.9)', css: 'veryhot' },
					{ from: 2, to: 3, color: 'rgba(255,165,0,.9)', css: 'hot' },
					{ from: 1, to: 2, color: 'rgba(220,220,0,.9)', css: 'warm' },
					{ from: -1, to: 1, color: 'rgba(0,180,0,.9)', css: 'neutral' },
					{ from: -2, to: -1, color: 'rgba(0,180,180,.9)', css: 'cool' },
					{ from: -3, to: -2, color: 'rgba(0,100,255,.9)', css: 'cold' },
					{ from: -4, to: -3, color: 'rgba(0,0,180,.9)', css: 'verycold' }
				]
			},
			"thresholds": {
				"ireq": {
					"icl": 1.0 //ireq > "icl-value" -> 
				},
				"phs": {
					"duration": 120, //duration limit <= "icl-value" -> 
					"sweat": 1.0,     //sweat rate per hour >= "icl-value" ->
				},
				"windchill": {
					"deltaT": 2.5
				}
			},
			"sim": {
				"duration": 180, //minutes (required for PHS)
			},
			"tips": {
				html: ""
			}
		};
	},
	loadSettings: function () {
		this.pageMap = {
			"home": "./pages/home.html",
			"dashboard": "./pages/dashboard.html",
			"forecast": "./pages/forecast.html",
			"settings": "./pages/settings.html",
			"feedback": "./pages/feedback.html",
			"onboarding": "./pages/onboarding.html",
			"disclaimer": "./pages/disclaimer.html",
			"details": "./pages/details.html",
			"about": "./pages/about.html",
			"location": "./pages/location.html",
			"indoor": "./pages/indoor.html",
			"research": "./pages/research.html",
			"error": "./pages/error.html"
		};
		
		this.showExpertLegend = false;
		this.currentProfile = "personal";
		this.selectedWeatherID = 0;
		this.maxForecast = 10; //8x3h = 24h
		
		var shadowKB = this.initKnowledgeBase();

		this.language = this.getLanguage(navigator.language);
		var msgString = ""; // String deciding message to show in console/toast

		// Distinguishing between a new and an existing user
		if (localStorage.getItem("knowledgebase_v2") === null) {
			// For all users with a different (older) version of the knowledgebase
			if (localStorage.getItem("knowledgebase") !== null) {
				localStorage.clear();
				this.knowledgeBase = shadowKB;
				this.knowledgeBase.user.guards.hasExternalDBRecord = 1; // Already in ClimApp DB
				// User will have to input personal settings (but from here on it will run smoothly)

				// Users downloading the app for the first time get new version of knowledgebase
			} else {
				this.knowledgeBase = shadowKB;
			}
			// Omitting saving to skip next if statement (want to end in line 445 after creating new kb)
		}

		if (localStorage.getItem("knowledgebase_v2") !== null) {
			this.knowledgeBase = JSON.parse(localStorage.getItem("knowledgebase_v2"));

			if ('version' in this.knowledgeBase && this.knowledgeBase.version < shadowKB.version) {
				// Saving user preferences before updating
				var userPreferences = this.knowledgeBase.user;   // Store old user data in temporary variable
				this.knowledgeBase = shadowKB;                   // Update knowledgebase to new version
				var mergedUserPreferences = MergeRecursive(shadowKB.user, userPreferences); // merge old user data into new user object
				this.knowledgeBase.user = mergedUserPreferences; // Add merged user data to knowledgebase

				if (typeof this.knowledgeBase.user.adaptation.heat.diff === 'number' || typeof this.knowledgeBase.user.adaptation.cold.diff === 'number') {
					this.knowledgeBase.user.adaptation.heat.diff = [];
					this.knowledgeBase.user.adaptation.cold.diff = [];
				}

				// Setting values of variables that have changed types since last kb version
				if(!'yearOfBirth' in this.knowledgeBase) {
					this.knowledgeBase.user.settings.clothing_selected = "Summer_attire";
					this.knowledgeBase.user.settings.headgear_selected = "none";

					var thisYear = new Date().getFullYear();
					this.knowledgeBase.user.settings.yearOfBirth = thisYear - shadowKB.user.settings.age;
				}

				msgString = this.translations.toasts.kb_updated[this.language];
			}
			else if ('version' in this.knowledgeBase && this.knowledgeBase.version == shadowKB.version) {
				msgString = this.translations.toasts.kb_loaded[this.language];
			}
			else { //old version does not have version key
				this.knowledgeBase = shadowKB;
				msgString = this.translations.toasts.kb_updated[this.language];
			}
		}
		else {
			this.knowledgeBase = shadowKB;
			msgString = this.translations.toasts.kb_created[this.language];
		}

		showShortToast(msgString + this.knowledgeBase.version);
		this.saveSettings();

		console.log("current language: " + this.language); // getting first two letters
		console.log("User settings: \n" + JSON.stringify(this.knowledgeBase.user)); // Showing current user settings
	},
	/* Getting language based on locale, if language is not supported, English is chosen */
	getLanguage: function (locale) {
		var shortenedLanguageIndicator = locale.slice(0, 2); // first two characters of ISO 639-1 code (https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
		
		if(["nb","no","nn"].includes(shortenedLanguageIndicator)) {
			// Norway does not completely follow the standard, handling that here.
			shortenedLanguageIndicator = "no";
		}

		var availableLanguages = ['en', 'da', 'nl', 'sv', 'no', 'el', 'it', 'de', 'es', 'fr', 'et', 'ja']; // list of all available languages, need to be updated manually

		if (availableLanguages.includes(shortenedLanguageIndicator)) {
			return shortenedLanguageIndicator;
		} else {
			return "en";
		}
	},
	firstTimeLoginWithoutPersonalization: function (target) {
		var self = this;
		return self.knowledgeBase.user.guards.isFirstLogin && target === 'home';
	},
	getSelectables: function (key) {
		var self = this;
		let unit = this.knowledgeBase.user.settings.unit;
		var obj_array = [];

		if (key.slice(0, 3) === "age") {
			var thisYear = new Date().getFullYear();
			for (var i = (thisYear - 100); i < thisYear; i++) {
				obj_array.push({ description: ""+i, value: i });
			}
		}
		else if (key === "height") {
			for (var i = 0; i < 100; i++) {
				if (this.knowledgeBase.user.settings.unit === "SI") {
					obj_array.push({ description: (i + 120) + " " + getHeightUnit(unit), value: (i + 120) });
				} else { // feet, inches (still want to save in cm, not changing value)
					obj_array.push({ description: ((i + 120) / 30.48).toFixed(1) + " " + getHeightUnit(unit), value: (i + 120) });
				}
			}
		}
		else if (key === "weight") {
			for (var i = 0; i < 100; i++) {
				if (this.knowledgeBase.user.settings.unit === "SI") {
					obj_array.push({ description: (i + 40) + " " + getWeightUnit(unit), value: (i + 40) });
				} else if (this.knowledgeBase.user.settings.unit === "US") {
					// (still want to save in kg, not changing value)
					obj_array.push({ description: Math.round((i + 40) * 2.2046) + " " + getWeightUnit(unit), value: (i + 40) });
				} else { // only UK left
					// (still want to save in kg, not changing value)
					obj_array.push({ description: (6 + i * 0.1).toFixed(1) + " " + getWeightUnit(unit), value: (i + 40) });
				}
			}
		}
		else if (key === "gender") {
			obj_array.push({ description: this.translations.labels.str_female[this.language], value: 0 });
			obj_array.push({ description: this.translations.labels.str_male[this.language], value: 1 });
		}
		else if (key === "unit") {
			obj_array.push({ description: "SI: kg, cm, m/s, Celsius", value: "SI" });
			obj_array.push({ description: "US: lbs, inch, m/s, Fahrenheit;", value: "US" });
			obj_array.push({ description: "UK: stone, inch, m/s, Celsius", value: "UK" });
		}
		else if (key === "windspeed") {
			obj_array.push({ description: this.translations.wheels.windspeed.description.no_wind[this.language], value: 1 });
			obj_array.push({ description: this.translations.wheels.windspeed.description.some_wind[this.language], value: 2 });
			obj_array.push({ description: this.translations.wheels.windspeed.description.strong_wind[this.language], value: 3 });
		}
		else if (["activity", "clothing", "headgear"].includes(key)) {
			var numElements = Object.keys(this.translations.wheels[key].label).length;
			var desc = "";
			var value = "";
			
			for(var i = 0; i < numElements; i++) {
			    desc = Object.keys(this.translations.wheels[key].label)[i];
			    value = this.translations.wheels[key].label[Object.keys(this.translations.wheels[key].label)[i]][this.language]; // rest, light, medium, high, intense
				console.log("desc: " + desc + " value: " + value);
				obj_array.push({ description: value, value: desc});
			}
		}

		/* CUSTOM INPUT */
		else if (key === "custom_input" || key === "open_windows") {
			obj_array.push({ description: this.translations.labels.str_yes[this.language], value: 1 });
			obj_array.push({ description: this.translations.labels.str_no[this.language], value: 0 });
		}

		else if (key === "_temperature") {
			if (this.knowledgeBase.user.settings.unit !== "SI") {
				// Fahrenheit
				for (var i = 59; i <= 83; i++) {
					let convertedTemp = getTemperatureValueInPreferredUnit(i, "US");
					obj_array.push({ description: convertedTemp.toFixed(1) + " F", value: convertedTemp.toFixed(1) });
				}
			} else {
				// Celcius
				for (var j = 15; j <= 28; j++) {
					obj_array.push({ description: j + " C", value: j });
				}
			}
		}
		else if (key === "_humidity") {
			for (var i = 0; i <= 100; i += 1) {
				obj_array.push({ description: i + " %", value: i });
			}
		}
		// using logic for windspeed above

		/* INDOOR MODE */
		else if (key === "thermostat_level") {
			
			var descriptions = ["--", "-","+/-","+","++"];
			for (var i = 1; i <= 5; i++) {
				obj_array.push({ description: i + ". (" + descriptions[i-1] +")", value: i });
			}
		}
		// logic for windows in custom output section
		return obj_array;
	},
	saveSettings: function () {
		let jsonData = JSON.stringify(this.knowledgeBase);
		localStorage.setItem("knowledgebase_v2", jsonData); // saving to new version for easier logic
	},
	updateLocation: function () {
		//$('i.fa-sync-alt').toggleClass("fa-spin");
		var self = this; //copy current scope into local scope for use in anonymous function 
		let options = { timeout: 30000 };
		navigator.geolocation.getCurrentPosition(
			function (position) { //on success
				self.knowledgeBase.position.lat = position.coords.latitude;
				self.knowledgeBase.position.lng = position.coords.longitude;
				
				//reset user position
				self.knowledgeBase.user.settings.coordinates_lat = position.coords.latitude; 
				self.knowledgeBase.user.settings.coordinates_lon = position.coords.longitude;
	
				self.knowledgeBase.position.timestamp = new Date(position.timestamp).toJSON();
				console.log("loc found: " + position.coords.latitude + "," + position.coords.longitude);
				self.saveSettings(); // ned to save before using coords in updateWeather
				self.updateWeather();
				//setTimeout( function(){ $('i.fa-sync-alt').toggleClass("fa-spin") }, 1000 );	
			},
			function (error) { //on error
				showShortToast(self.translations.toasts.no_location[self.language]);
				console.log(error);
				//self.loadUI("error");
			},
			options // here the timeout is introduced
		);
	},
	updateWeather: async function () {
		var self = this;
		self.checkIfUserExistInDB().then((result) => {
			getAppIDFromDB(self.knowledgeBase).then((appidFromServer) => {
				if (appidFromServer) {
					let url = "http://www.sensationmapps.com/WBGT/api/worldweather.php";
					var [lat, lon] = getLocation(this.knowledgeBase); // Custom or GPS
					let data = {
						"action": "helios",
						"lat": lat,
						"lon": lon,
						"climapp": appidFromServer,
						"d": 1.0, //
						"utc": new Date().toJSON()
					};
					$("#current_time").html("<i class='fas fa-spinner fa-pulse'></i>");
					$.get(url,
						data,
						function (output) {//on success
							try {
								let weather = JSON.parse(output);

								if(self.knowledgeBase.user.guards.customLocationEnabled) { 
									// Used to show last weather station
									self.knowledgeBase.user.settings.station = weather.station;
								}
								self.knowledgeBase.weather.station = weather.station;
								self.knowledgeBase.weather.distance = weather.distance ? weather.distance : 0;
								self.knowledgeBase.weather.utc = "utc" in weather ? weather.utc : weather.dt;

								//returns current weather by default in key "weather.currentweather"
								//prepend to array.
								self.knowledgeBase.weather.utc.unshift(weather.currentweather.dt);

								self.knowledgeBase.weather.utc = self.knowledgeBase.weather.utc.map(function (val) {
									let str = val.replace(/-/g, "/");
									str += " UTC";
									return str;
								});

								self.knowledgeBase.weather.lat = weather.lat;
								self.knowledgeBase.weather.lng = weather.lon;

								self.knowledgeBase.weather.wbgt = weather.wbgt_min.map(Number);
								self.knowledgeBase.weather.wbgt.unshift(Number(weather.currentweather.wbgt_min));

								self.knowledgeBase.weather.wbgt_max = weather.wbgt_max.map(Number);
								self.knowledgeBase.weather.wbgt_max.unshift(Number(weather.currentweather.wbgt_max));

								self.knowledgeBase.weather.windchill = weather.windchill.map(Number);
								self.knowledgeBase.weather.windchill.unshift(Number(weather.currentweather.windchill));
								
								self.knowledgeBase.weather.humidity = weather.rh.map(Number);
								self.knowledgeBase.weather.humidity.unshift(Number(weather.currentweather.rh));
								
								self.knowledgeBase.weather.temperature = weather.tair.map(Number);
								self.knowledgeBase.weather.temperature.unshift(Number(weather.currentweather.tair));

								
								//do not do indoor stuff here. - only weather report	
								
								self.knowledgeBase.weather.windspeed = weather.vair.map(Number);
								self.knowledgeBase.weather.windspeed.unshift(Number(weather.currentweather.vair));
								
								self.knowledgeBase.weather.globetemperature = weather.tglobe_clouds.map(Number);
								self.knowledgeBase.weather.globetemperature.unshift(Number(weather.currentweather.tglobe_clouds));

								self.knowledgeBase.weather.clouds = weather.clouds.map(Number);
								self.knowledgeBase.weather.clouds.unshift(Number(weather.currentweather.clouds));

								self.knowledgeBase.weather.rain = weather.rain.map(Number);
								self.knowledgeBase.weather.rain.unshift(Number(weather.currentweather.rain));

								self.knowledgeBase.weather.radiation = weather.solar_clouds.map(Number);
								self.knowledgeBase.weather.radiation.unshift(Number(weather.currentweather.solar_clouds));

								self.knowledgeBase.weather.meanradianttemperature = [];
								self.knowledgeBase.weather.windspeed2m = [];
								
								
								$.each( self.knowledgeBase.weather.windspeed, function(key, vair){
										var Tg = self.knowledgeBase.weather.globetemperature[key];
										var Ta = self.knowledgeBase.weather.temperature[key];
										var va = vair * Math.pow( 0.2, 0.25 ); //stability class D Liljgren 2008 Table 3
						
										
										var WF1 = 0.4 * Math.pow( Math.abs( Tg - Ta ), 0.25 ); //Bernard implementation according to Lemke
										var WF2 = 2.5 * Math.pow( va, 0.6 );
										var WF = WF1 > WF2 ? WF1 : WF2;
										var Tmrt = 100.0 * Math.pow( Math.pow((Tg + 273.0) / 100.0, 4 ) + WF * (Tg - Ta), 0.25) - 273.0;
										
										self.knowledgeBase.weather.meanradianttemperature.push( Tmrt );
										self.knowledgeBase.weather.windspeed2m.push( va );
								} );

								self.knowledgeBase.weather.watervapourpressure = [];
								$.each(self.knowledgeBase.weather.humidity,
									function (key, val) {
										let T = self.knowledgeBase.weather.temperature[key];
										let wvp = 0.1 * (val * 0.01) * Math.exp(18.965 - 4030 / (T + 235));
										self.knowledgeBase.weather.watervapourpressure.push(wvp);
									});
								self.calcThermalIndices();
								self.updateUI();
								self.updateUTCI(0);
								self.saveSettings();
															
								// Only update when weather data has been received - and when external DB record is present.
								if (self.knowledgeBase.user.guards.hasExternalDBRecord) {									
									addWeatherDataToDB(self.knowledgeBase);
								}
							}
							catch (error) {
								alert(error);
								console.log( error);
							}
						}).fail(function (e) {
							console.log("fail in weather " + e);
						});
				} else {
					showShortToast(self.translations.toasts.weather_fail[self.language]);
				}
			}); // Making code execution wait for app id retrieval
		});
	},
	updateIndoorPrediction: async function(){		
		$("#predicted_temperature").html('<i class="fas fa-spinner fa-spin"></i>');
		$("#predicted_humidity").html('<i class="fas fa-spinner fa-spin"></i>');
		var self = this;
		var rh_indoor = this.getPredictedIndoorHumidity();
		this.knowledgeBase.user.settings.humidity_indoor_predicted = rh_indoor;
		
		getIndoorPrediction(self.knowledgeBase).then((temp) => {
			self.knowledgeBase.user.settings.temp_indoor_predicted = Number(temp);
			rh_indoor = self.getPredictedIndoorHumidity();
			self.knowledgeBase.user.settings.humidity_indoor_predicted = rh_indoor;
			self.saveSettings();
			self.updateUI();
			//$("#indoorSection").show();
		});
	},
	getPredictedIndoorHumidity: function(){
		var vp_outdoor = this.knowledgeBase.weather.watervapourpressure[0];
		var T_indoor = Number(self.knowledgeBase.user.settings.temp_indoor_predicted);
		var vp_indoor = 0.1 * Math.exp(18.965 - 4030 / (T_indoor + 235));
		return rh_indoor = Math.round( vp_outdoor / ( 0.01 * vp_indoor ) );
	},
	getWindspeedTextFromValue: function (val) {
		self = this;
		var text = "";
		switch (val) {
			case 1:
				text = self.translations.wheels.windspeed.description.no_wind[self.language];
				break;
			case 2:
				text = self.translations.wheels.windspeed.description.some_wind[self.language];	
				break;
			case 3:
				text = self.translations.wheels.windspeed.description.strong_wind[self.language];
				break;		
			default:
				// To information for user with earlier version on knowledgebase
				text = self.translations.wheels.windspeed.description.no_wind[self.language];
				self.knowledgeBase.user.settings.windspeed = 1;
				self.saveSettings();
				break;
		}
		return text;
	},
	translateTextToWindspeed: function (description) {
		// Based on wind speeds from: https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwjSq7ndjrzkAhVmposKHboJAGYQjRx6BAgBEAQ&url=https%3A%2F%2Fearthscience.stackexchange.com%2Fquestions%2F12562%2Fwhat-wind-speeds-and-gusts-can-usually-damage-houses-or-trees&psig=AOvVaw2Z8Ea0UmXAVcEuFrzpHpyU&ust=1567856490789493
		var windspeed = 0; // km/h
		switch (description) {
			case 1:
				windspeed = 1; // calm
				break;
			case 2:
				windspeed = 15; // light breeze
				break;
			case 3:
				windspeed = 35; // fresh breeze
				break;
			default:
				windspeed = 0; // something went wrong
		}
		return windspeed;
	},
	loadUI: function (pageid, afteraction ) {
		var self = this;
		
		$.get(this.pageMap[pageid], function (content) {
			console.log("loaded: " + pageid);
			self.currentPageID = pageid;
			$("#content").html(content);
			self.updateUI();
			if( afteraction === "startintro" ){
				startIntro( self.translations, self.language );
			}
		});
	},
	checkIfUserExistInDB: async function () {
		var self = this;
		if (!self.knowledgeBase.user.guards.hasExternalDBRecord && typeof (self.knowledgeBase.user.guards.hasExternalDBRecord) !== 'undefined') {
			console.log("creating new user.");
			
			createUserRecord(self.knowledgeBase).then((userCreatedInDB) => {
				// Only update value on success
				if (userCreatedInDB) {
					console.log("User added to database.");
					self.knowledgeBase.user.guards.hasExternalDBRecord = 1;
					self.saveSettings();
				}
			});
		} else {
			console.log("User exist in database.");
		}
	},
	calcThermalIndices: function () {
		
		this.knowledgeBase.thermalindices.ireq = [];
		this.knowledgeBase.thermalindices.phs = [];
		this.knowledgeBase.thermalindices.pmv = [];
		var options = {
			air: {},
			body: {
				"M": M(this.knowledgeBase), 	//W/m2 
				"work": 0,		//W/m2 external work 
				"posture": 2,		//1= sitting, 2= standing, 3= crouching
				"weight": this.knowledgeBase.user.settings.weight,		//kg  
				"height": this.knowledgeBase.user.settings.height / 100,	//m
				"drink": 0,	// may drink freely
				"accl": 0		//% acclimatisation state either 0 or 100						
			},
			cloth: {
				"Icl": getClo(this.knowledgeBase), 	//clo
				"p": getAirPermeability(this.knowledgeBase), 	// Air permeability (low < 5, medium 50, high > 100 l/m2s)
				"im_st": getMoisturePermeability(this.knowledgeBase), 	// static moisture permeability index
				"fAref": 0.54,	// Fraction covered by reflective clothing
				"Fr": 0.97,	// Emissivity reflective clothing
			},
			move: {
				"walk_dir": NaN, 	//degree walk direction
				"v_walk": 0.833,	//m/s walking speed assuming slow moving
			},
			sim: {
				"mod": 0
			}
		};
		
		
		var self = this;
		$.each(this.knowledgeBase.weather.temperature, function (index, val) {
			options.air = {
				"Tair": self.knowledgeBase.weather.temperature[index], 	//C
				"rh": self.knowledgeBase.weather.humidity[index], 	//% relative humidity
				"Pw_air": self.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
				"Trad": self.knowledgeBase.weather.meanradianttemperature[index], 	//C mean radiant temperature
				"Tglobe": self.knowledgeBase.weather.globetemperature[index],
				"v_air": self.knowledgeBase.weather.windspeed2m[index], 	//m/s air velocity at 2m.
				"v_air10": self.knowledgeBase.weather.windspeed[index],  //m/s air velocity at 10m.
			};
			
			heatindex.IREQ.set_options(options);
			heatindex.IREQ.sim_run();
			var ireq = heatindex.IREQ.current_result();
			
			var ireq_object = {
				"ICLminimal": Math.max( 0.05, ireq.ICLminimal ),//always wear something due to social constraint
				"DLEminimal": ireq.DLEminimal,
				"ICLneutral": Math.max( 0.1, ireq.ICLneutral ),//always wear something due to social constraint - little more than minimal for math reasons.
				"DLEneutral": ireq.DLEneutral,
				"M": options.body.M,
				"Icl": options.cloth.Icl,
				"p": options.cloth.p,
				"im_st": options.cloth.im_st,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air, //@2m
				"v_air10": options.air.v_air10, //@10m
				"Trad": options.air.Trad,
				"Tglobe": options.air.Tglobe,
				"clouds": self.knowledgeBase.weather.clouds[index],
				"rain": self.knowledgeBase.weather.rain[index],
				"rad": self.knowledgeBase.weather.radiation[index],
				"wbgt": self.knowledgeBase.weather.wbgt[index],
				"wbgt_max": self.knowledgeBase.weather.wbgt_max[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			};
			self.knowledgeBase.thermalindices.ireq.push(ireq_object);
			
			
			heatindex.PHS.set_options(options);
			heatindex.PHS.sim_init();

			let simduration = self.knowledgeBase.sim.duration;
			for (var i = 1; i <= simduration; i++) {
				var res = heatindex.PHS.time_step();
			}
			
			var phs = heatindex.PHS.current_result();
			
			var phs_object = {
				"D_Tre": Math.min(self.knowledgeBase.sim.duration, isNaN(phs.D_Tre) ? Infinity : phs.D_Tre ),
				"Dwl50": phs.Dwl50,
				"SWtotg": phs.SWtotg,
				"M": options.body.M,
				"Icl": options.cloth.Icl,
				"p": options.cloth.p,
				"im_st": options.cloth.im_st,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air, //@2m
				"v_air10": options.air.v_air10, //@10m
				"Trad": options.air.Trad,
				"Tglobe": options.air.Tglobe,
				"clouds": self.knowledgeBase.weather.clouds[index],
				"rain": self.knowledgeBase.weather.rain[index],
				"rad": self.knowledgeBase.weather.radiation[index],
				"wbgt": self.knowledgeBase.weather.wbgt[index],
				"wbgt_max": self.knowledgeBase.weather.wbgt_max[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			};
			self.knowledgeBase.thermalindices.phs.push(phs_object);
			
			//
			//pmv indoor - we only use current condition, but future may require forecast			
			//Pw_air assumed equal indoor and outdoor, RH different because of temperature difference.
			//let wvp = 0.1 * (val * 0.01) * Math.exp(18.965 - 4030 / (T + 235));
			var vp_outdoor = self.knowledgeBase.weather.watervapourpressure[index];
			var T_indoor = Number(self.knowledgeBase.user.settings._temperature);
			var rh_indoor = Number(self.knowledgeBase.user.settings._humidity);
			
			
		
			var v_indoor = self.knowledgeBase.user.settings.open_windows ? 0.25 * self.knowledgeBase.weather.windspeed[index] : 0.1;
			options.air = {
				"Tair": T_indoor, 	//C
				"rh": rh_indoor, 	//% relative humidity
				"Pw_air": self.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
				"Trad": T_indoor, 	//C mean radiant temperature
				"v_air": v_indoor,
				"v_air10": self.knowledgeBase.weather.windspeed[index],  //m/s air velocity at 10m.
			};
			
			heatindex.PMV.set_options(options);
			heatindex.PMV.sim_run();
			var pmv = heatindex.PMV.current_result();
			var pmv_object = {
				"PMV": pmv.PMV,
				"PPD": pmv.PPD,
				"M": options.body.M,
				"Icl": options.cloth.Icl,
				"p": options.cloth.p,
				"im_st": options.cloth.im_st,
				"Tair": options.air.Tair,
				"rh": options.air.rh,
				"v_air": options.air.v_air, //@2m
				"v_air10": options.air.v_air10, //@10m
				"Trad": options.air.Trad,
				"Tglobe": options.air.Trad,
				"clouds": self.knowledgeBase.weather.clouds[index],
				"rain": self.knowledgeBase.weather.rain[index],
				"rad": self.knowledgeBase.weather.radiation[index],
				"wbgt": self.knowledgeBase.weather.wbgt[index],
				"wbgt_max": self.knowledgeBase.weather.wbgt_max[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			}			
			self.knowledgeBase.thermalindices.pmv.push(pmv_object);
		});
		
		self.saveSettings();
	},
	updateUI: async function () {
		// context dependent filling of content
		this.initNavbarListeners();
		$(".navigation_back_settings").hide();
		$(".navigation_back_dashboard").hide();
		$(".navigation_back_custom").hide();
		
		var self = this;
		
		if( this.currentPageID !== "location"){
			$("#google_maps_elem").hide();	
		}
		else if( this.knowledgeBase.user.guards.customLocationEnabled ){ //location screen and enabled
			var [lat, lon] = getLocation(self.knowledgeBase);
			$("#google_maps_elem").fadeIn(100, function(){
				initMap(lat,lon, self.knowledgeBase);
			});
		}


		if (this.currentPageID == "onboarding") {
			/*
			$(".navigation").hide();

			// Setting page content
			$("#str_welcome").html(this.translations.labels.str_welcome[this.language]);
			$("#onboarding_to_dashboard").html(this.translations.sentences.onboarding_to_dashboard[this.language]);			
			$("#str_dashboard").html(this.translations.labels.str_dashboard[this.language]);
			*/
		}
		else if( this.currentPageID == "home" ){
			$(".navigation").show();
			$("#main_panel").show();
			
			this.initActivityListeners();
			this.initSettingsListeners();
			this.initPerceptionListeners();
			this.initMenuListeners();
			this.initGeolocationListeners();
			
			
			//set the climapp icon
			var icon = "<i class='fas fa-male fa-3x'></i>";
			var icon_small = "<i class='fas fa-male fa-2x'></i>";
			if( this.currentProfile === "personal" ){
				if( this.knowledgeBase.user.settings.gender === 0 ){
					icon = "<i class='fas fa-female fa-3x'></i>";
					icon_small = "<i class='fas fa-female fa-2x'></i>";
				}
			}
			else if ( this.currentProfile === "seniors" ){
				icon = "<i class='fas fa-blind fa-3x'></i>";
				icon_small = "<i class='fas fa-blind fa-2x'></i>";
			}
			else if ( this.currentProfile === "children" ){
				icon = "<i class='fas fa-child fa-3x'></i>";
				icon_small = "<i class='fas fa-child fa-2x'></i>";
			}
			$("#climapp_icon").html( icon );
			$("#climapp_icon_peak").html( icon_small );
			$("#climapp_icon_nadir").html( icon_small );
			
			//
			this.updateMenuItems();
						
			var indoorOutdoorMode = this.knowledgeBase.user.guards.isIndoor ? this.translations.labels.str_indoor[this.language] : this.translations.labels.str_outdoor[this.language];
			
			$("#str_current").html( this.translations.labels.str_current[this.language] );
			$("#indoor_outdoor").html( indoorOutdoorMode );
			$("#str_forecast").html( this.translations.labels.str_forecast[this.language] );
			
			
			if( this.knowledgeBase.user.guards.isIndoor ){
				$("#dashboard_header").show();
				$("#forecast_panel").hide();
				$("#wbgt_panel").hide();
				$("#phs_panel").hide();
				$("#windchill_panel").hide();
				$("#ireq_panel").hide();
				$("#neutral_panel").hide();
				$("#details_panel").hide();
				
				
				$("#windspeedcontainer").hide();
				
				this.initIndoorListeners();
				
				this.updateIndoor();
			}
			else{
				$("#dashboard_header").show();
				$("#forecast_panel").show();
				$("#wbgt_panel").show();
				$("#phs_panel").show();
				$("#windchill_panel").show();
				$("#ireq_panel").show();
				$("#neutral_panel").show();
				$("#details_panel").show();
				$("#windspeedcontainer").show();
				
				this.updateInfo( this.selectedWeatherID, true );			
				
				//check for peak
				var [ peak_i, peak_val, peak_mode ] = this.getPeak();
				
				if( peak_val > 1 ){					
					this.updatePeakInfo( peak_i );
				}
				else{
					$("#peak_container").hide();
				}
				//check for nadir
				//check for peak
				var [ nadir_i, nadir_val, nadir_mode ] = this.getNadir();
				
				if( nadir_val > 1 ){
					this.updateNadirInfo( nadir_i );
				}
				else{
					$("#nadir_container").hide();
				}
			}			
			
			
			
			$("#str_menu_measures").html(this.translations.labels.str_menu_measures[this.language]);
			$("#str_menu_hydration").html(this.translations.labels.str_menu_hydration[this.language]);	
			
			/*customisation*/
			$("#str_customisation").html( this.translations.labels.str_customisation[this.language] );
			
			$("#str_activity").html(this.translations.labels.str_activity[this.language]);
			$("#str_clothing").html(this.translations.labels.str_clothing[this.language]);
			$("#str_info").html(this.translations.labels.str_info[this.language]);
			$("#str_perception").html(this.translations.labels.str_perception[this.language]);
			
			$("#str_perception_settings").html(this.translations.labels.str_perception[this.language]);	
			$("#str_perception_general_1").html(this.translations.sentences.str_perception_general_1[this.language]);
			$("#str_perception_general_2").html(this.translations.sentences.str_perception_general_2[this.language]);
			
			$("#perception_colder").html( this.translations.labels.str_colder[this.language] );
			$("#perception_justright").html( this.translations.labels.str_just_right[this.language] );
			$("#perception_warmer").html( this.translations.labels.str_warmer[this.language] );

			
			$("#str_activity_level").html(this.translations.labels.str_activity_level[this.language]);
			$("#str_clothing_level").html(this.translations.labels.str_clothing_level[this.language]);

		}
		else if (this.currentPageID == "error") {
			$(".navigation").hide();
			this.initErrorListeners();
			
			// Set page content
			$("#error_retrieve_weather").html(this.translations.sentences.error_retrieve_weather[this.language]);
			$("#str_try_again").html(this.translations.labels.str_try_again[this.language]);
		}
		else if (this.currentPageID == "dashboard") {
			$(".navigation").show();
			$("#main_panel").show();
			$("#tip_panel").show();
			this.initDashboardListeners();
			
			this.initGeolocationListeners();
			
			this.initActivityListeners();
			
			this.initMenuListeners();
						
			this.updateMenuItems();
			
			if (this.knowledgeBase.user.guards.isIndoor) {
				// Hide forecast when custom input is used
				$("#navbar-location").hide();
				$("#dashboard_header").show();
				$("#index-selector").hide();
				
				this.updateInfo( 0 , false );
				
			} else {
				$("#navbar-forecast").show();
				$("#index-selector").show();
				$("#navbar-location").show();
				$("#dashboard_header").show();
				$("#dashboard_forecast").show();
				
				
				console.log( "updateUI => dashboard updateInfo");
				this.updateInfo(this.selectedWeatherID, false );
				console.log( "updateUI => dashboard updateInfo done");
			}
			
			console.log( "updateUI => dashboard indoorOutdoorMode");
			
			var indoorOutdoorMode = this.knowledgeBase.user.guards.isIndoor ? this.translations.labels.str_indoor[this.language] : this.translations.labels.str_outdoor[this.language];

			
			
			
			$("#indoor_outdoor").html(indoorOutdoorMode);
			
			$("#str_activity_level").html(this.translations.labels.str_activity_level[this.language]);
			$("#str_clothing_level").html(this.translations.labels.str_clothing_level[this.language]);
			$("#str_activity").html(this.translations.labels.str_activity[this.language]);
			$("#str_clothing").html(this.translations.labels.str_clothing[this.language]);
			$("#str_headgear").html(this.translations.labels.str_headgear[this.language]);
			//$("#head_gear").html(this.translations.labels.str_headgear[this.language]);

			
			
		}
		else if (this.currentPageID == "details") {
			$(".navigation").hide();
			$(".navigation_back_dashboard").show();
		}
		else if (this.currentPageID == "settings") {
			$(".navigation").show();
			this.initSettingsListeners();
			this.initMenuListeners();
			
			let unit = this.knowledgeBase.user.settings.unit;
			
			$("#str_profile").html( this.translations.labels.str_profile[this.language] );
			$("#str_personal").html( this.translations.labels.str_personal[this.language] );
			$("#str_group").html( this.translations.labels.str_group[this.language] );
			
			$("#str_select_myself").html( this.translations.sentences.str_select_myself[this.language] );
			$("#str_elderly").html( this.translations.labels.str_elderly[this.language] );
			$("#str_children").html( this.translations.labels.str_children[this.language] );
			
			
			$("#str_select_seniors").html( this.translations.sentences.str_select_seniors[this.language] );
			$("#str_select_children").html( this.translations.sentences.str_select_children[this.language] );
			
			$("#str_preferences").html(this.translations.labels.str_preferences[this.language].toUpperCase());
			$("#str_unit").html(this.translations.labels.str_unit[this.language]);
			$("#unit").html(this.knowledgeBase.user.settings.unit + " " + this.translations.labels.str_units[this.language]);
		
			$("#str_other").html(this.translations.labels.str_other[this.language].toUpperCase());			
			$("#str_about").html(this.translations.labels.str_about[this.language]);
			$("#str_disclaimer_and_privacy").html(this.translations.labels.str_disclaimer_and_privacy[this.language]);
			$("#str_how_to_use").html(this.translations.sentences.str_how_to_use[this.language]);
			
			$("#str_research").html(this.translations.labels.str_research[this.language]);
		}
		else if (this.currentPageID == "feedback") {
			$(".navigation").hide();
			$(".navigation_back_settings").show();
			this.initFeedbackListeners();
			this.knowledgeBase.user.guards.feedbackSliderChanged = 0;

			// Set page content
			$("#gauge_text_top").html(this.translations.sentences.feedback_adaptation_score[this.language]);
			$("#str_colder").html(this.translations.labels.str_colder[this.language]);			
			$("#str_warmer").html(this.translations.labels.str_warmer[this.language]);			
			$("#str_ok").html(this.translations.labels.str_ok[this.language]);			
			$("#str_more_questions").html(this.translations.labels.str_more_questions[this.language].toUpperCase());			
			$("#str_submit_data").html(this.translations.labels.str_submit_data[this.language]);
			// TODO - add text for feedback questions			

			// Draw gauge with current index value 
			let index = 0; // 0 = current situation -- is this what we want? -BK tricky tbd
			this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, false).then(
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					
					$("#gauge_text_top_diff").hide();
					$("#reset_icon").hide();
					
					this.drawGauge('feedback_gauge', width, personalvalue, thermal);
					
					this.knowledgeBase.user.adaptation.mode = thermal;
					
					// Save current gauge value as original value
					this.knowledgeBase.user.adaptation[thermal].predicted = modelvalue;
					
					this.saveSettings();
					var diff_array = this.knowledgeBase.user.adaptation[thermal].diff;
					
					$("div[data-listener='adaptation']").attr("data-context", thermal);
					
					// Set text around gauge and slider
					if (diff_array.length >= 1) {
						$("#gauge_text_top_diff").show();
						
						$("#reset_icon").show();
						// Personal heat/cold alert limit: <value>		
						$("#gauge_text_top_diff").html(this.translations.labels.str_personal[this.language] + " " + thermal + " " + this.translations.labels.str_alert_level[this.language] +": " + diff_array[0].toFixed(1));						

					}
					$("#gauge_text_bottom").html(this.translations.sentences.feedback_adaptation_colder_warmer[this.language]);

					// Question text
					$("#question1").html(this.translations.feedback.question1.text[this.language]);
					$("#question2").html(this.translations.feedback.question2.text[this.language]);
					$("#question3").html(this.translations.feedback.question3.text[this.language]);
					
					// Set rating bar text (under feedback buttons) using last given feedback
					$("#ratingtext1").html(self.translations.feedback.question1.ratingtext[self.knowledgeBase.feedback.question1][this.language]);
					$("#ratingtext2").html(self.translations.feedback.question2.ratingtext[self.knowledgeBase.feedback.question2][this.language]);
					$("#ratingtext3").html(self.translations.feedback.question3.ratingtext[self.knowledgeBase.feedback.question3][this.language]);

					// Rating bar values
					$("input[id='1star" + 3 + "']").attr("checked", true);
					$("input[id='2star" + 3 + "']").attr("checked", true);
					$("input[id='3star" + 3 + "']").attr("checked", true);
				});
		}
		else if (this.currentPageID == "about") {
			$(".navigation").hide();
			$(".navigation_back_settings").show(); //BK: class used as id - consider using id - #navigation_back_settings instead of .
			
			// Setting page content
			$("#str_era4cs").html(this.translations.labels.str_era4cs[this.language]);
			$("#about_read_more").html(this.translations.sentences.about_read_more[this.language]);
			$("#about_climapp_team").html(this.translations.sentences.about_climapp_team[this.language]);	
			
			$("#str_cred").html(this.translations.labels.str_cred[this.language]);
			$("#about_acknowledge_human_heat_exchange").html(this.translations.sentences.about_acknowledge_human_heat_exchange[this.language]);
			$("#acknowledgement_utci").html(this.translations.sentences.acknowledgement_utci[this.language]);
			$("#about_acknowledge_liljegren").html(this.translations.sentences.about_acknowledge_liljegren[this.language]);
			
			$("#about_acknowledge_openweathermap").html(this.translations.sentences.about_acknowledge_openweathermap[this.language]);
			$("#about_josh_foster").html(this.translations.sentences.about_josh_foster[this.language]);
			$("#about_nick_ravanelli").html(this.translations.sentences.about_nick_ravanelli[this.language]);
			$("#about_acknowledge_infographics").html(this.translations.sentences.about_acknowledge_infographics[this.language]);
			$("#about_acknowledge_fontawesome").html(this.translations.sentences.about_acknowledge_fontawesome[this.language]);

			$("#str_app_info").html(this.translations.labels.str_app_info[this.language]);
			
			$("#app_version").html(this.translations.labels.str_app_version[this.language] + ": " + this.knowledgeBase.app_version);
			$("#kb_version").html(this.translations.labels.str_kb_version[this.language] + ": " + this.knowledgeBase.version);
		}
		else if (this.currentPageID == "disclaimer") {
			$(".navigation").hide();
			$(".navigation_back_settings").show();

			// Setting page content
			$("#str_disclaimer").html(this.translations.labels.str_disclaimer[this.language]);
			$("#disclaimer_under_development").html(this.translations.sentences.disclaimer_under_development[this.language]);
			$("#disclaimer_era4cs").html(this.translations.sentences.disclaimer_era4cs[this.language]);
			$("#str_privacy").html(this.translations.labels.str_privacy[this.language]);
			$("#disclaimer_privacy_policy").html(this.translations.sentences.disclaimer_privacy_policy[this.language]);
		}
		else if (this.currentPageID == "location") {

			this.initLocationListeners();
			this.initMenuListeners();
			this.initIndoorListeners();
			
			$("#str_custom_location").html(this.translations.labels.str_custom_location[this.language]);
			$("#str_input_custom_location").html(this.translations.labels.str_input_custom_location[this.language]);
			//$("#str_location").html(this.translations.labels.str_location[this.language]);
			$("#str_set_location").html(this.translations.labels.str_set_location[this.language]);
			$("#location_header").html(this.translations.labels.str_choose_location[this.language]);
			
			// Location
			//this.knowledgeBase.user.guards.customLocationEnabled ? $("#customLocationSection").show() : $("#customLocationSection").hide();
			$("#custom_location_checkbox").prop("checked", this.knowledgeBase.user.guards.customLocationEnabled);
			
			if( this.knowledgeBase.user.guards.isIndoor ){
				$("#selectoutdoor").hide();
				$("#selectindoor").show();
			}
			else {
				$("#selectoutdoor").show();
				$("#selectindoor").hide();
			}
			
			/*select mode*/
			$("#str_outdoor").html(this.translations.labels.str_outdoor[this.language]);
			$("#str_indoor").html(this.translations.labels.str_indoor[this.language]);
			
			
			$("#str_select_outdoor").html(this.translations.sentences.str_select_outdoor[this.language]);
			$("#str_select_indoor").html(this.translations.sentences.str_select_indoor[this.language]);
			
			$("#str_user_values").html(this.translations.sentences.str_user_values[this.language]);
			$("#str_predicted_values").html(this.translations.sentences.str_predicted_values[this.language]);		
			
			
			var windowsOpen = this.knowledgeBase.user.settings.open_windows ? this.translations.labels.str_yes[this.language] : this.translations.labels.str_no[this.language];
			// Setting page content
			$("#str_temperature").html(this.translations.labels.str_indoor_temperature[this.language]);
			$("#str_humidity").html(this.translations.labels.str_humidity[this.language]);
			$("#indoor_open_windows").html(this.translations.labels.indoor_open_windows[this.language]);
			
			$("#str_thermostat").html(this.translations.labels.str_thermostat[this.language]);
			$("#str_temperature_predicted").html(this.translations.labels.str_temperature[this.language]);
			$("#str_humidity_predicted").html(this.translations.labels.str_humidity[this.language]);
	
			$("#str_thermostat_explanation").html( this.translations.sentences.str_thermostat_explanation[this.language]);
			$("#str_predictedexplanation").html( this.translations.sentences.str_predictedexplanation[this.language]);
			
			
			// Values
			$("#thermostat_level").html(this.knowledgeBase.user.settings.thermostat_level);
			
			var tempUnit = this.knowledgeBase.user.settings.unit === "US" ? "&#176;F" : "&#176;C";
			$("#_temperature").html( this.knowledgeBase.user.settings._temperature  + tempUnit);
			$("#_humidity").html(this.knowledgeBase.user.settings._humidity + " %");
			$("#open_windows").html(windowsOpen);
			
			$("#predicted_temperature").html( Math.floor( this.knowledgeBase.user.settings.temp_indoor_predicted )  + tempUnit);
			$("#predicted_humidity").html( Math.floor( this.knowledgeBase.user.settings.humidity_indoor_predicted )  + " %");
		}
		else if (this.currentPageID == "indoor") {
			
			$(".navigation_back_settings").hide();
			$(".navigation_back_dashboard").hide();
			$(".navigation_back_custom").hide();
			$("#indoor_checkbox").prop("checked", this.knowledgeBase.user.guards.isIndoor);
			this.initIndoorListeners();

			var windowsOpen = this.knowledgeBase.user.settings.open_windows ? this.translations.labels.str_yes[this.language] : this.translations.labels.str_no[this.language];
			
			// Setting page content
			$("#str_indoor_outdoor_mode").html(this.translations.labels.str_indoor_outdoor_mode[this.language]);
			$("#str_use_indoor_mode").html(this.translations.labels.str_use_indoor_mode[this.language]);
			$("#str_thermostat").html(this.translations.labels.str_thermostat[this.language]);
			$("#str_temperature").html(this.translations.labels.str_indoor_temperature[this.language]);
			$("#indoor_open_windows").html(this.translations.labels.indoor_open_windows[this.language]);
			//$("#str_wind_speed").html(this.translations.labels.str_wind_speed[this.language]);
			//$("#str_humidity").html(this.translations.labels.str_humidity[this.language]);
			//$("#str_continue").html(this.translations.labels.str_continue[this.language]);

			// Values
			var tempUnit = this.knowledgeBase.user.settings.unit === "US" ? "&#176;F" : "&#176;C";
			$("#_temperature").html( this.knowledgeBase.user.settings._temperature  + tempUnit);
			//$("#windspeed").html(this.getWindspeedTextFromValue(this.knowledgeBase.user.settings.windspeed));
			//$("#_humidity").html(this.knowledgeBase.user.settings._humidity + " %");
			$("#thermostat_level").html(this.knowledgeBase.user.settings.thermostat_level);
			$("#open_windows").html(windowsOpen);
		}
		else if (this.currentPageID == "research" ){
			this.initResearchListeners();
			$(".navigation").hide();
			$(".navigation_back_settings").show(); //BK: class used as id - consider using id - #navigation_back_settings instead of .
			
			$("#str_research_label").html(this.translations.labels.str_research_label[this.language]);
			$("#str_research_consent").html(this.translations.labels.str_research_consent[this.language]);
			$("#str_climapp_id").html(this.translations.labels.str_climapp_id[this.language]);
			$("#climapp_id").html( deviceID() );
			$("#str_submit_research_data_point").html(this.translations.labels.str_submit_research_data_point[this.language]);
			
			
			var feedbacklinks = {'en': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'da': "https://docs.google.com/forms/d/e/1FAIpQLSdA1CpZFsZyXJRovENqCM1ioavephEtrssOeR70gxVY0krexA/viewform", 
								'nl': "https://docs.google.com/forms/d/e/1FAIpQLSfBVqKBDmOEJJy_Yl9dQbjmswaz4fDNhAcow-q_yRuhhNaUPg/viewform", 
								'sv': "https://docs.google.com/forms/d/e/1FAIpQLSepcKUb65uTmXTQ4I_98ks8CjE9wFONLunKjZgi7Tvj_v-VHA/viewform", 
								'no': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'el': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'it': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'de': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'es': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'fr': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'et': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform", 
								'ja': "https://docs.google.com/forms/d/e/1FAIpQLScDAzUO-5J8foAquRDSBiRc5vNPt7hMKcLg-NXXcx_68lWOwQ/viewform" };
			var str = this.translations.sentences.str_feedback_app_link[this.language];
			var url = feedbacklinks[this.language];
			str += "<br> <a href='"+url+"' target='_blank'>"+this.translations.labels.str_questionnaire[this.language]+"</a>";
			$("#str_feedback_app_link").html( str );
			
		}
	},
	updateMenuItems: function () {
		let selected = this.knowledgeBase.user.settings.activity_selected;
		$("#activityslider").val( this.knowledgeBase.activity.values[selected].i );  
		
		$("#dashboard_activity").html(this.translations.wheels.activity.label[selected][this.language]);
		let caption_ = this.translations.wheels.activity.description[selected][this.language];	
		$("#activityCaption").html(caption_);

		selected = this.knowledgeBase.user.settings.clothing_selected;
		$("#clothingslider").val( this.knowledgeBase.clothing.values[selected].i );  
		
		$("#dashboard_clothing").html(this.translations.wheels.clothing.label[selected][this.language]);
		caption_ = this.translations.wheels.clothing.description[selected][this.language];
		$("#clothingCaption").html(caption_);
		
		
		$("#slider_insulation").val( this.knowledgeBase.user.settings.insulation_selected );  
		$("#slider_insulation_value").html( this.knowledgeBase.user.settings.insulation_selected );
		
		$("#slider_windpermeability").val( this.knowledgeBase.user.settings.windpermeability_selected);  
		$("#slider_windpermeability_value").html( this.knowledgeBase.user.settings.windpermeability_selected );
		
		$("#slider_vapourpermeability").val( this.knowledgeBase.user.settings.vapourpermeability_selected );  
		$("#slider_vapourpermeability_value").html( this.knowledgeBase.user.settings.vapourpermeability_selected );
		
		//personal info
		let unit = this.knowledgeBase.user.settings.unit;
		let height = this.knowledgeBase.user.settings.height;
		let weight = this.knowledgeBase.user.settings.weight;

		$("#str_personal_settings").html(this.translations.labels.str_personal_settings[this.language].toUpperCase());

		$("#str_age").html(this.translations.labels.str_age[this.language]);
		$("#age").html(getAgeFromYearOfBirth(this.knowledgeBase.user.settings.yearOfBirth) + " " + this.translations.labels.str_years[this.language]);
		
		$("#str_height").html(this.translations.labels.str_height[this.language]);
		$("#height").html(getCalculatedHeightValue(unit, height) + " " + getHeightUnit(unit));
		
		$("#str_weight").html(this.translations.labels.str_weight[this.language]);
		$("#weight").html(getCalculatedWeightValue(unit, weight) + " " + getWeightUnit(unit));
		
		$("#str_gender").html(this.translations.labels.str_gender[this.language]);
		var genderAsText = this.knowledgeBase.user.settings.gender == 0 ? this.translations.labels.str_female[this.language] : this.translations.labels.str_male[this.language];
		$("#gender").html(genderAsText);
		
		$("#str_acclimatization").html(this.translations.labels.str_acclimatization[this.language]);
		$("#acclimatization_checkbox").prop("checked", this.knowledgeBase.user.settings.acclimatization);
		$("#str_heatacclimatised_iso7243").html(this.translations.sentences.str_heatacclimatised_iso7243[this.language]);
		
	},
	updateDetails: function( index, thermal, modelvalue ){
		// Setting all page text content from translations sheet
				
		$("#str_more_info").html(firstCharToUpper(this.translations.labels.str_more_info[this.language]));
		$("#str_details").html(this.translations.labels.str_details[this.language]);
		$("#details_desc").html(this.translations.sentences.details_desc[this.language]);
		$("#str_weather").html(this.translations.labels.str_weather[this.language]);
		
		
		$("#str_detail_time").html(this.translations.labels.str_time[this.language]);
		$("#str_detail_air_temperature").html(this.translations.labels.str_air_temperature[this.language]);
		$("#str_detail_humidity").html(this.translations.labels.str_humidity[this.language]);
		$("#str_detail_cloud_cover").html(this.translations.labels.str_cloud_cover[this.language]);
		$("#str_detail_wind10").html(this.translations.labels.str_wind10[this.language]);
		$("#str_detail_wind2").html(this.translations.labels.str_wind2[this.language]);
		$("#str_detail_mrt").html(this.translations.labels.str_mrt[this.language]);
		$("#str_detail_globe_temperature").html(this.translations.labels.str_globe_temperature[this.language]);
		$("#str_detail_solar_irradiation").html(this.translations.labels.str_solar_irradiation[this.language]);
		$("#str_detail_wbgt").html(this.translations.labels.str_wbgt[this.language]);
		$("#str_detail_wbgt_effective").html(this.translations.labels.str_wbgt_effective[this.language]);
		$("#str_detail_aal").html(this.translations.labels.str_aal[this.language]);
		$("#str_detail_pal").html(this.translations.labels.str_pal[this.language]);
		$("#str_detail_windchill").html(this.translations.labels.str_windchill[this.language]);
		$("#str_detail_mr").html(this.translations.labels.str_mr[this.language]);
		$("#str_detail_surface_area").html(this.translations.labels.str_surface_area[this.language]);
		$("#str_detail_clo").html(this.translations.labels.str_clo[this.language]);
		$("#str_detail_wind_permeability").html(this.translations.labels.str_wind_permeability[this.language]);
		$("#str_detail_evaporative_permeability").html(this.translations.labels.str_evaporative_permeability[this.language]);
		
		
		$("#str_detail_user").html(this.translations.labels.str_user[this.language]);
		$("#str_detail_wbgt").html(this.translations.labels.str_wbgt[this.language]);
		$("#str_detail_wbgt_iso").html(this.translations.labels.str_wbgt_iso[this.language]);
		$("#details_wbgt_desc_1").html(this.translations.sentences.details_wbgt_desc_1[this.language]);
		$("#details_wbgt_desc_2").html(this.translations.sentences.details_wbgt_desc_2[this.language]);
				
		$("#str_detail_phs_iso").html(this.translations.labels.str_phs_iso[this.language]);
		$("#details_phs_desc_1").html(this.translations.sentences.details_phs_desc_1[this.language]);
		$("#details_phs_desc_2").html(this.translations.sentences.details_phs_desc_2[this.language]);
		$("#details_phs_desc_3").html(this.translations.sentences.details_phs_desc_3[this.language]);
		
		$("#str_detail_windchill_jagti").html(this.translations.labels.str_windchill_jagti[this.language]);
		$("#details_windchill_desc_1").html(this.translations.sentences.details_windchill_desc_1[this.language]);
		$("#details_windchill_desc_2").html(this.translations.sentences.details_windchill_desc_2[this.language]);					
		
		$("#str_detail_ireq_iso").html(this.translations.labels.str_ireq_iso[this.language]);
		$("#details_ireq_desc").html(this.translations.sentences.details_ireq_desc[this.language]);
		$("#details_ireq_list1").html(this.translations.sentences.details_ireq_desc_list1[this.language]);
		$("#details_ireq_list2").html(this.translations.sentences.details_ireq_desc_list2[this.language]);
		$("#details_ireq_list3").html(this.translations.sentences.details_ireq_desc_list3[this.language]);

		$("#details_ireq_clo_1").html(this.translations.sentences.details_ireq_clo_1[this.language]);
		$("#details_ireq_clo_2").html(this.translations.sentences.details_ireq_clo_2[this.language]);
		$("#details_ireq_clo_3").html(this.translations.sentences.details_ireq_clo_3[this.language]);
		
		$("#str_min_cloth_level").html(this.translations.labels.str_min_cloth_level[this.language]);
		$("#str_max_cloth_level").html(this.translations.labels.str_max_cloth_level[this.language]);

		$("#details_ireq_clo_dle_1").html(this.translations.sentences.details_ireq_clo_dle_1[this.language]);
		$("#details_ireq_clo_dle_2").html(this.translations.sentences.details_ireq_clo_dle_2[this.language]);
		$("#details_neutral").html(this.translations.sentences.details_neutral[this.language]);
	
		//add values
		let tair = 0;
		let rh = 0;
		let vair2 = 0;
		let tglobe = 0;
		let tmrt = 0;
		
		if (this.knowledgeBase.user.guards.isIndoor) {
			tair = this.knowledgeBase.user.settings._temperature;
			rh = this.knowledgeBase.thermalindices.pmv[index].rh.toFixed(0);
			vair2 = this.knowledgeBase.thermalindices.pmv[index].v_air.toFixed(1);
			tmrt = this.knowledgeBase.thermalindices.pmv[index].Trad.toFixed(1);
			tglobe = this.knowledgeBase.thermalindices.pmv[index].Tglobe.toFixed(1);
		} else {
			rh = this.knowledgeBase.thermalindices.phs[index].rh.toFixed(0);
			vair2 = this.knowledgeBase.thermalindices.phs[index].v_air.toFixed(1);
			tair = this.knowledgeBase.thermalindices.phs[index].Tair.toFixed(1);
			tmrt = this.knowledgeBase.thermalindices.phs[index].Trad.toFixed(1);
			tglobe = this.knowledgeBase.thermalindices.phs[index].Tglobe.toFixed(1);
		}
		let clouds = this.knowledgeBase.thermalindices.phs[index].clouds.toFixed(0);

		let rad = this.knowledgeBase.thermalindices.phs[index].rad.toFixed(0);
		let vair10 = this.knowledgeBase.thermalindices.phs[index].v_air10.toFixed(1);
		 
		let wbgt = this.knowledgeBase.thermalindices.phs[index].wbgt.toFixed(1);
		let wbgt_eff = getWBGTeffective(wbgt, this.knowledgeBase);
		let ral = RAL(this.knowledgeBase);
		let personal_ral = ral;

		var windchill = this.knowledgeBase.thermalindices.phs[index].windchill.toFixed(1);

		var M = this.knowledgeBase.thermalindices.phs[index].M.toFixed(0);				
		
		var A = BSA(this.knowledgeBase).toFixed(1);

		let Icl = (0.155 * this.knowledgeBase.thermalindices.phs[index].Icl);
		Icl = Icl.toFixed(3);

		let p = this.knowledgeBase.thermalindices.phs[index].p.toFixed(2);
		let im = this.knowledgeBase.thermalindices.phs[index].im_st.toFixed(2);

		let utc_date = new Date(this.knowledgeBase.thermalindices.ireq[index].utc); //
		let local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
			hour: '2-digit',
			minute: '2-digit'
		});

		$("#detail_time").html(local_time);
		let unit = this.knowledgeBase.user.settings.unit;
		
		$("#detail_airtemp").html( getTemperatureValueInPreferredUnit( tair, unit) + " " + getTemperatureUnit( unit ) );
		$("#detail_rh").html(rh + "%");
		$("#detail_clouds").html(clouds + "%");

		$("#detail_wind10m").html(vair10 + "m/s");
		$("#detail_wind2m").html(vair2 + "m/s");

		
		$("#detail_tglobe").html(getTemperatureValueInPreferredUnit( tglobe, unit) + " " + getTemperatureUnit( unit ) );
		$("#detail_mrt").html(getTemperatureValueInPreferredUnit( tmrt, unit) + " " + getTemperatureUnit( unit ) );
		

		$("#detail_rad").html(rad + "W/m<sup>2</sup>");
		
		if( this.knowledgeBase.user.guards.isIndoor ){
			$("div[data-group='wbgt']").hide();
			$("div[data-group='ireq']").hide();
		}
		else{
			if( thermal === "heat" ){
				$("div[data-group='wbgt']").show();
				$("div[data-group='ireq']").hide();
			
				$("#detail_wbgt").html(getTemperatureValueInPreferredUnit( wbgt, unit) + " " + getTemperatureUnit( unit ) );
				$("#detail_wbgt_eff").html(getTemperatureValueInPreferredUnit( wbgt_eff, unit) + " " + getTemperatureUnit( unit ) );
				$("#detail_ral").html( getTemperatureValueInPreferredUnit( ral, unit) + " " + getTemperatureUnit( unit ) );
			}
			else{
				$("div[data-group='wbgt']").hide();
				$("div[data-group='ireq']").show();
				$("#detail_windchill").html( getTemperatureValueInPreferredUnit( windchill, unit) + " " + getTemperatureUnit( unit ) );						
			}
		}
		
		$("#detail_metabolic").html(M + "W/m<sup>2</sup>");
		$("#detail_area").html(A + "m<sup>2</sup>")

		$("#detail_icl").html(Icl + "m<sup>2</sup>K/W");
	
		$("#detail_p").html(p + "L/s/m<sup>2</sup>");
		$("#detail_im").html(im);
				
		if( this.knowledgeBase.user.guards.isIndoor ){
			$("div[data-context='heat'],div[data-context='phs'],div[data-context='neutral'],div[data-context='cold']").hide();
		}
		else{
			let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
			let icl_neutral = this.knowledgeBase.thermalindices.ireq[ index].ICLneutral;
			let icl_worn = getClo(this.knowledgeBase);
			let cold_index = this.calculateColdIndex(icl_neutral, icl_min, icl_worn, true); // minimal - worn, if negative you do not wear enough clothing

			let heat_index = WBGTrisk( wbgt, this.knowledgeBase );

			let draw_heat_gauge = this.isDrawHeatGauge( cold_index, heat_index, index );
		
			if( modelvalue <= -1 || ( modelvalue >=1 && thermal == "cold") ){
				$("div[data-context='heat'],div[data-context='phs'],div[data-context='neutral']").hide();
				$("div[data-context='cold']").show();
	
				let windrisk = windchillRisk( windchill );
				let windriskcat = windrisk ? "a risk of frostbite in" : "no risk of frostbite";
				$("#detail_exposed_windchill").html( getTemperatureValueInPreferredUnit( windchill, unit) + " " + getTemperatureUnit( unit ) );
				$("#detail_exposed_windriskcat").html( windriskcat );
				if( windrisk ){
					$("#detail_exposed_windrisk").html( windrisk + " minutes");
				}

				let icl_max = this.knowledgeBase.thermalindices.ireq[index].ICLneutral;

				let dle_min = 60 * this.knowledgeBase.thermalindices.ireq[index].DLEminimal;
				dle_min = dle_min.toFixed(0);

				let activity = this.knowledgeBase.user.settings.activity_selected;
				$("#detail_activity_ireq").html(activity);
				
				$("#detail_icl_max").html(icl_max);
				$("#detail_icl_min").html(icl_min);

				let minicon = clothingIcon(icl_min);
				let maxicon = clothingIcon(icl_max);

				$("#detail_min_clo").html("<img src='" + minicon + "' class='small'/>");
				$("#detail_max_clo").html("<img src='" + maxicon + "' class='small'/>");

				$("#detail_dle_ireq").html(dle_min);
				
				if( dle_min <= 0 ){
					$( "#details_dle_positive" ).hide();
				}
				else{
					$( "#details_dle_positive" ).show();
				}
			}
			else if (modelvalue >= 1) {
				$("div[data-context='cold'],div[data-context='phs'],div[data-context='neutral']").hide();
				$("div[data-context='heat']").show();

				$("#detail_wbgt_iso7243").html( getTemperatureValueInPreferredUnit( wbgt_eff, unit) + " " + getTemperatureUnit( unit ) );
				$("#detail_ral_iso7243").html( getTemperatureValueInPreferredUnit( ral, unit) + " " + getTemperatureUnit( unit ) );

				if (wbgt_eff >= ral ) {
					$("div[data-context='phs']").show();
					let d_tre = this.knowledgeBase.thermalindices.phs[index].D_Tre ? this.knowledgeBase.thermalindices.phs[index].D_Tre : ">120";
					let d_sw = this.knowledgeBase.thermalindices.phs[index].Dwl50;
					let sw_tot_per_hour = 0.001 * this.knowledgeBase.thermalindices.phs[index].SWtotg /
						(this.knowledgeBase.sim.duration / 60); //liter per hour
					sw_tot_per_hour = sw_tot_per_hour.toFixed(1);

					$("#detail_sweat").html(sw_tot_per_hour);
					$("#detail_dle_phs").html(d_tre);
				}
			}
			else {
				$("div[data-context='cold'],div[data-context='phs'],div[data-context='heat']").hide();
				$("div[data-context='neutral']").show();
			}
		}
	},
	calculateColdIndex: function( icl_neutral, icl_min, icl_worn, isPersonalised ){
		var value = 0;
		if( icl_worn < icl_min ){
			value = 1 +  icl_min - icl_worn; //values are switched sign in representation (i.e. +1, becomes -1 in the graph)
		}
		else if( icl_worn <= icl_neutral ){
			var range = icl_neutral - icl_min;
			var x = icl_worn - icl_min; //reference from icl_min
			value = 1 - x/range;
		}
		else if( icl_worn > icl_neutral ){
			value = -Math.min( 4, icl_worn - icl_neutral ); // negative cold index = positive heat balance
		}
		return value;
	},
	getPeak: function(){
		var peak_i = 0;
		var peak_val = 0;
		var peak_mode = "heat";
		var maxIndex = Math.min( this.knowledgeBase.thermalindices.ireq.length, this.maxForecast);
		
		for( var i=1; i<maxIndex; i++){
			
			var icl_min = this.knowledgeBase.thermalindices.ireq[i].ICLminimal;
			var icl_neutral = this.knowledgeBase.thermalindices.ireq[i].ICLneutral;
			var icl_worn = getClo(this.knowledgeBase);
			
			var model_cold_index = Math.abs( this.calculateColdIndex( icl_neutral, icl_min, icl_worn, false) ); 
			var model_heat_index = Math.abs( WBGTrisk( this.knowledgeBase.thermalindices.phs[i].wbgt, this.knowledgeBase, false ) );	
						
			if( model_heat_index > peak_val ){
				peak_val = model_heat_index;
				peak_i = i;
				peak_mode = "heat";
			}			
		}
		return [ peak_i, peak_val, peak_mode ];
	},
	updatePeakInfo: function( index ){
		var utc_date = new Date(this.knowledgeBase.thermalindices.ireq[index].utc); //
		var local_peak_time = utc_date.toLocaleString(navigator.language, { //language specific setting
			weekday: 'long', hour: 'numeric', minute: 'numeric'
		});
		
		this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, false).then(
			([width, personalvalue, modelvalue, thermal, tip_html]) => {
				$("#str_peak").html( this.translations.labels.str_peak[this.language] );
				$("#peak_time").html( local_peak_time );
				$("#peakslider").val( modelvalue );
				
				if( thermal === "heat" ){
					if( this.currentProfile === "seniors"){
						tip_html = this.updateSeniorTipsHeat(modelvalue, tip_html);
					}
					else if( this.currentProfile === "children"){
						tip_html = this.updateChildrenTipsHeat(modelvalue, tip_html);
					}
				}
				$("#advise_peak").html( tip_html );
				$("#peak_label").html(  gaugeTitleHeat(modelvalue, this.translations, this.language).toUpperCase() );
				$("#climapp_icon_peak").css('color', getCurrentGaugeColor( modelvalue ) );
				
				$("#peak_container").show();
		});
	},
	getNadir: function(){
		var peak_i = 0;
		var peak_val = 0;
		var peak_mode = "heat";
		var maxIndex = Math.min( this.knowledgeBase.thermalindices.ireq.length, this.maxForecast);
		
		for( var i=1; i<maxIndex; i++){
			
			var icl_min = this.knowledgeBase.thermalindices.ireq[i].ICLminimal;
			var icl_neutral = this.knowledgeBase.thermalindices.ireq[i].ICLneutral;
			var icl_worn = getClo(this.knowledgeBase);
			
			var model_cold_index = this.calculateColdIndex( icl_neutral, icl_min, icl_worn, false); 
						
			if( model_cold_index > peak_val ){
				peak_val = model_cold_index;
				peak_i = i;
				peak_mode = "cold";
			}
		}
		return [ peak_i, peak_val, peak_mode ];
	},
	updateNadirInfo: function( index ){
		var utc_date = new Date(this.knowledgeBase.thermalindices.ireq[index].utc); //
		var local_peak_time = utc_date.toLocaleString(navigator.language, { //language specific setting
			weekday: 'long', hour: 'numeric', minute: 'numeric'
		});
		this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, false).then(
			([width, personalvalue, modelvalue, thermal, tip_html]) => {
				
				if( thermal === "cold" ){
					modelvalue = -modelvalue;
				}
				$("#str_nadir").html( this.translations.labels.str_nadir[this.language] );
				
				$("#nadir_time").html(local_peak_time);
				$("#advise_nadir").html( tip_html );
				$("#nadir_label").html( gaugeTitleCold( modelvalue, this.translations, this.language ).toUpperCase() );
				$("#climapp_icon_nadir").css('color', getCurrentGaugeColor( -modelvalue ) );
				
				$("#nadir_container").show();
				
		});
	},
	updateIndoor: function(){
		$("#peak_container").hide();
		$("#nadir_container").hide();
		$("#station").html( this.knowledgeBase.weather.station );
		$("#temperature").html(getTemperatureValueInPreferredUnit(this.knowledgeBase.user.settings._temperature, this.knowledgeBase.user.settings.unit) );
		$("#temp_unit").html(getTemperatureUnit(this.knowledgeBase.user.settings.unit));
		
		$("#humidity_value").html(this.knowledgeBase.user.settings._humidity);
		$("#windspeed").html(this.getWindspeedTextFromValue(this.knowledgeBase.user.settings.windspeed));
		//$("#open_windows").html(this.knowledgeBase.user.settings.open_windows);
		
		// Remove weather indication from dashboard // substitute with windows open/close
        //$("#icon-weather").removeClass().addClass("fab").addClass("fa-windows");
		//$("#weather_desc").html(this.knowledgeBase.user.settings.open_windows ? this.translations.labels.indoor_open_windows[this.language] : this.translations.labels.indoor_no_open_windows[this.language]);
	
	
		//time and location
		//#station
		
		var utc_date = new Date( this.knowledgeBase.thermalindices.pmv[0].utc ); //
		var local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
			hour: '2-digit',
			minute: '2-digit'
		});
		$("#current_time").html(local_time);
		var pmv = Math.max(-4, Math.min( 4, this.knowledgeBase.thermalindices.pmv[0].PMV ) );//cut off between -4 and +4
		
		$("#currentslider").val( pmv );//set the slider
		
		var currentlabel = pmv <= 0 ? gaugeTitleCold(-pmv, this.translations, this.language) : gaugeTitleHeat( pmv, this.translations, this.language );
		$("#current_label").html( currentlabel );
		
		
		var tiphtml = indoorTips( this.knowledgeBase, this.translations, this.language );
		
		$("#climapp_icon").css('color', getCurrentGaugeColor( pmv ) );
		
		if( this.currentProfile === "seniors"){
			tiphtml = this.updateSeniorTipsHeat(pmv, tiphtml);
		}
		else if( this.currentProfile === "children"){
			tiphtml = this.updateChildrenTipsHeat(pmv, tiphtml);
		}
		
		$("#advise_current").html( tiphtml );
		var thermal = pmv >= 0 ? "heat" : "cold";
		
		
		var infocards = this.getInfoCards( 0, true, thermal, pmv);		
		$("#measure_info_cards").html( infocards );
		this.updatePerception(thermal, pmv );
	},
	getDrawGaugeParamsFromIndex: async function(index, kb, leveloverride ) {
		
		console.log( "getDrawGaugeParamsFromIndex " + index );
		var icl_min = kb.thermalindices.ireq[index].ICLminimal;
		var icl_neutral = kb.thermalindices.ireq[index].ICLneutral;
		var icl_worn = getClo(kb);
		var personal_cold_index = this.calculateColdIndex( icl_neutral, icl_min, icl_worn, true); 
		var model_cold_index = this.calculateColdIndex( icl_neutral, icl_min, icl_worn, false); 
		
	
		var personal_heat_index = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, true );
		var model_heat_index = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, false );	
			
		var pmv_index = kb.thermalindices.pmv[index].PMV;
		
		var isIndoor = this.knowledgeBase.user.guards.isIndoor;
		if( isIndoor ){
			personal_heat_index = pmv_index;
			model_heat_index = pmv_index;
			personal_cold_index = pmv_index;
			model_cold_index = pmv_index;
		}
		//console.log( "getDrawGaugeParamsFromIndex cold " + model_cold_index + " heat " + model_heat_index );
		let draw_heat_gauge = this.isDrawHeatGauge( model_cold_index, model_heat_index, index );

		let tip_html = "";
		let thermal = draw_heat_gauge ? "heat" : "cold";
		//console.log( "getDrawGaugeParamsFromIndex thermal " + thermal );
		
		let level = leveloverride ? 2 : kb.user.settings.level;
		
		let personal_value = this.determineThermalIndexValue(personal_cold_index, personal_heat_index, index, isIndoor);
		let model_value = this.determineThermalIndexValue(model_cold_index, model_heat_index, index, isIndoor);
				
		if( isIndoor ){
			tip_html += indoorTips( kb, this.translations, this.language);
		}
		else{
			if ( !draw_heat_gauge ) {
				tip_html += coldLevelTips(index, level, kb, personal_cold_index, this.currentPageID, this.translations, this.language);
			}
			else {
				var fromThermalAdvisor = await heatLevelTips(index, level, kb, this.currentPageID, this.translations, this.language);
				tip_html += fromThermalAdvisor;
			}
		}
		
		let windowsize = $(window).width();
		let width = windowsize / 2.5;
		return [ width, personal_value, model_value, thermal, tip_html ];
	},
	// ireq only valid with temperatures less than 10
	/*
	isDrawColdGauge: function (cold, heat, index) {
		return Math.abs(cold) >= heat
			   &&
		this.knowledgeBase.thermalindices.ireq[ index].Tair <= 15; //ireq only from <10 however, 15 can already be cold with 0.5 clo
	},
	*/
	isDrawHeatGauge: function (cold, heat, index) {
		return heat > 0.8; //based on wbgt effective we enter first risk category
	},
	determineThermalIndexValue: function (cold, heat, index, isIndoor) {
		if( isIndoor ){
			return cold; //return pmv value 
		}
		else{
			var value = this.isDrawHeatGauge(cold, heat, index) ? heat : -cold; //mirror cold over x-axis such that y=1 projects to y=-1
		}
		return Math.max(-4, Math.min(4, value) );//value between -4 and +4
	},
	updateInfo: function (index, isDrawChart ) {
		var self = this;
		if ( this.knowledgeBase.thermalindices.ireq.length > 0 && !this.knowledgeBase.user.guards.isIndoor ) {
			$("#icon-weather").show();
			$("#weather_desc").show();
			
			this.updateWeatherDetails(index);
			
			var utc_date = new Date(this.knowledgeBase.thermalindices.ireq[index].utc); //
			var local_time = utc_date.toLocaleTimeString(navigator.language, { //language specific setting
				hour: '2-digit',
				minute: '2-digit'
			});
			
			if( this.knowledgeBase.thermalindices.utci.length > 0){
				$("#utci_head").html( this.knowledgeBase.thermalindices.utci[index].utci_head );
				$("#utci_message").html( this.knowledgeBase.thermalindices.utci[index].utci_message );
			}
			
			
			this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, false).then(
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					//console.log("update info draw gauge phase 2 " + [width, personalvalue, modelvalue, thermal, tip_html]);
					//self.drawGauge('main_gauge', width, personalvalue, thermal
					this.currentThermal = thermal;
					$("#current_time").html(local_time);
					$("#currentslider").val( modelvalue );
					if( thermal === "heat" ){
						if( this.currentProfile === "seniors"){
							tip_html = this.updateSeniorTipsHeat(modelvalue, tip_html);
						}
						else if( this.currentProfile === "children"){
							tip_html = this.updateChildrenTipsHeat(modelvalue, tip_html);
						}
					}
					
					$("#advise_current").html( tip_html );
					
					var label = thermal === "heat" ? gaugeTitleHeat(modelvalue, this.translations, this.language) : gaugeTitleCold( -modelvalue, this.translations, this.language );
					
					this.updatePerception(thermal, modelvalue );
					
					
					$("#current_label").html( label.toUpperCase() );
					$("#str_perception_thermal").html( label );
					
					$("#climapp_icon").css('color', getCurrentGaugeColor( modelvalue ) );
					
					if( isDrawChart ){
						this.drawChart('main_gauge', width, thermal, true );
						// Set dashboard content using translations sheet
						$("#str_weather_report").html(this.translations.labels.str_weather_report[this.language]);
						$("#str_forecast_disclaimer").html(this.translations.sentences.str_forecast_disclaimer[this.language]);
			
						if( this.knowledgeBase.user.settings.index === "Climapp" ){
							$("#plot_legend").show();
							$("#str_climapp_legend").html(this.translations.sentences.str_climapp_legend[this.language]);
				
							if( this.showExpertLegend ){
								$("#str_hide_helper_lines").html(this.translations.sentences.str_hide_helper_lines[this.language]);
								$("#str_show_helper_lines").hide();
								$("#str_hide_helper_lines").show();
										
								$("#str_ireq_legend").html(this.translations.sentences.str_ireq_legend[this.language]);
								$("#str_wbgt_legend").html(this.translations.sentences.str_wbgt_legend[this.language]);
							}
							else{
								$("#str_show_helper_lines").html(this.translations.sentences.str_show_helper_lines[this.language]);
								$("#str_show_helper_lines").show();
								$("#str_hide_helper_lines").hide();
							}
						}
						else{
							$("#plot_legend").hide();
						}
					}					
					var labelstr = thermal === "heat" ? this.translations.labels.str_heat_index[this.language]: this.translations.labels.str_cold_index[this.language];
					
					$("#climapp_thermal").html( labelstr );
					$("#utci_thermal").html( this.translations.sentences.dash_utci_english_only[this.language] );
					$("#tips").html(tip_html);
					$("#circle_gauge_color").css("color", getCurrentGaugeColor(modelvalue));
					$("#main_panel").fadeIn(500);
					
					var infocards = this.getInfoCards(index, false, thermal, modelvalue );
					$("#measure_info_cards").html( infocards );
					
					
					$("div[data-listener='menu']div[data-targetgroup='modelgroup']").removeClass("menufocus");	
					if( this.knowledgeBase.user.settings.index === "Climapp" ){
						$("#tabclimapp").addClass("menufocus");
						$("#selectwork").show();
					}
					else{
						$("#tabutci").addClass("menufocus");
						$("#selectwork").hide();
					}
					
					//details
					this.updateDetails( index, thermal, modelvalue );
				});
			
		} 
	},
	getInfoCards: function( index, isindoor, thermal, modelvalue){
		var infocards = "";
		console.log( "infocards - thermal: " + thermal + " model: " + modelvalue );
		if( isindoor && this.currentProfile === "personal" && thermal === "heat" && modelvalue > 1 ){
			
			//hot weather - plan ahead
			if( modelvalue >= 2 ){ 
				infocards += "<div class='even'><img src='./img/infographics/"+this.language+"/Experts/HSExperts_Box1.png'/></div>";
			}
			
			//sweat - g/min
			var sweatrate = this.knowledgeBase.thermalindices.phs[index].SWtotg / this.knowledgeBase.sim.duration;
			if( sweatrate > 4 ){ 
				infocards += "<div class='even'><img src='./img/infographics/"+this.language+"/Experts/HSExperts_Box3.png'/></div>";
			}
			
			//higher than moderate activity level
			var ISO_selected = this.knowledgeBase.user.settings.activity_selected;
			if( this.knowledgeBase.activity.values[ ISO_selected ].val > 300 ){ 
				infocards += "<div class='even'><img src='./img/infographics/"+this.language+"/Experts/HSExperts_Box4.png'/></div>";
			}

			//CAF > 0
			if( getCAF(this.knowledgeBase ) > 0 ){
				infocards += "<div class='even'><img src='./img/infographics/"+this.language+"/Experts/HSExperts_Box5.png'/></div>";
			}
		}
		else if( thermal === "heat" && modelvalue > 1 ){
			//sweat - g/min
			infocards += "<div class='even'><img src='./img/infographics/"+this.language+"/Experts/HSExperts_Box3.png'/></div>";
		}
		else if( thermal === "cold" ){
			let windchill = this.knowledgeBase.weather.windchill[index];
			
			if( !isindoor && windchill < 10 && modelvalue <= 0){
				infocards += "<div class='even'><img src='./img/infographics/en/Cold/wind.png'/></div>";
			}
			if( !isindoor && windchill <= 5 ){
				infocards += "<div class='even'><img src='./img/infographics/en/Cold/extremities.png'/></div>";
			}
			if( modelvalue <= -1 ){
				infocards += "<div class='even'><img src='./img/infographics/en/Cold/cold.png'/></div>";
			}
			if( modelvalue >= 0 ){
				infocards += "<div class='even'><img src='./img/infographics/en/Cold/overdress.png'/></div>";
			}
		}
		else if( isindoor && modelvalue > 1 && this.currentProfile === "personal" ){
			var info_indices = [1,2];
			var self = this;
			$.each( info_indices, function(key, ind){
				infocards += "<div class='even'><img src='./img/infographics/"+self.language+"/Workers/Workers_Box"+ind+".png'/></div>";
			} );
			
			//higher than moderate activity level
			var ISO_selected = this.knowledgeBase.user.settings.activity_selected;
			
			if( this.knowledgeBase.activity.values[ ISO_selected ].val > 300 ){ 
				infocards += "<div class='even'><img src='./img/infographics/"+self.language+"/Experts/HSExperts_Box4.png'/></div>";
			}
		}
		return infocards;
	},
	updatePerception: function(thermal, modelvalue ){
		
		$("input[data-listener='perception']").attr( "data-mode", thermal );
		$("input[data-listener='perception']").attr( "data-predicted", modelvalue );
		
		var perceived = this.knowledgeBase.user.adaptation[thermal].perceived;
		$("input[data-listener='perception']").val( perceived );
		
		var perceptionstr = "";
		if( thermal === "heat" && modelvalue > 0.5 && perceived > 0){
			perceptionstr = this.translations.sentences.str_perception_heat_more[this.language];
		}
		else if( thermal === "heat" && modelvalue > 0.5 && perceived < 0){
			perceptionstr = this.translations.sentences.str_perception_heat_less[this.language];
		}
		else if( thermal === "cold" && modelvalue < -0.5 && perceived > 0){
			perceptionstr = this.translations.sentences.str_perception_cold_less[this.language];
		}
		else if( thermal === "cold" && modelvalue < -0.5 && perceived < 0){
			perceptionstr = this.translations.sentences.str_perception_cold_more[this.language];
		}
		else if( thermal === "cold" && modelvalue > 0 && perceived > 0){
			perceptionstr = this.translations.sentences.str_perception_heat_more[this.language];
		}
		else if( thermal === "cold" && modelvalue > 0 && perceived < 0){
			perceptionstr = this.translations.sentences.str_perception_heat_less[this.language];
		}
		$("#perception_label").html(perceptionstr);
	},
	updateSeniorTipsHeat: function(value, tips){
		var html = "<p>"+this.translations.sentences.senior_general[this.language]+"</p>";
		
		if( value > 1 ){
			html += "<ul>";
			html += "<li>" + this.translations.sentences.senior_dark_urine[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_drink[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_call[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_medications[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_coolest[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_windows[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_sun_facing[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_loose[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_visit[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.senior_keep_cool[this.language]+ "</li>";
			html += "</ul>";
		}
		else{
			html = tips + html;
		}
		
		return html;
	},
	updateChildrenTipsHeat: function(value, tips){
		var html = "<p>"+this.translations.sentences.children_general_heat[this.language]+"</p>";
		if( value > 1 ){
			html += "<ul>";
			html += "<li>" + this.translations.sentences.children_drink[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.children_activity[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.children_sun[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.children_water[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.children_fruit[this.language]+ "</li>";
			html += "<li>" + this.translations.sentences.children_sleep[this.language]+ "</li>";
			html += "</ul>";
		}
		else{
			html = tips + html;
		}
		return html;
	},
	updateWeatherDetails: function( index ){
		let distance = parseFloat(this.knowledgeBase.weather.distance).toFixed(0);
		
		var isCustomLocation = customLocationEnabled(this.knowledgeBase) ? ", " + this.translations.labels.str_custom[this.language] : "";
		$("#station").html(this.knowledgeBase.weather.station + " (" + distance + " km)" + isCustomLocation);
		
		$("#temperature").html(getTemperatureValueInPreferredUnit(this.knowledgeBase.thermalindices.ireq[index].Tair, this.knowledgeBase.user.settings.unit).toFixed(0) );
		
		$("#temperature_desc").html(this.translations.labels.str_temperature[this.language]);
		$("#temp_unit").html(getTemperatureUnit(this.knowledgeBase.user.settings.unit));
		
		let ws = this.knowledgeBase.thermalindices.ireq[index].v_air10; //m/s 
		$("#windspeed").html(ws.toFixed(0));
		
		$("#humidity").html(this.translations.labels.str_humidity[this.language]);
		$("#humidity_value").html(this.knowledgeBase.thermalindices.ireq[index].rh.toFixed(0));

		$("#windspeed_desc").html(this.translations.labels.str_wind[this.language] + " ");
		$("#windspeed_unit").html(getWindspeedUnit(this.knowledgeBase.user.settings.unit));

		//weather icon
		let clouds = this.knowledgeBase.thermalindices.ireq[index].clouds;
		let rain = this.knowledgeBase.thermalindices.ireq[index].rain;
		let solar = this.knowledgeBase.thermalindices.ireq[index].rad;

		// Weather descriptions aligned with https://openweathermap.org/weather-conditions
		
		let icon_weather = "fa-cloud-sun-rain";
		if (solar > 0) { //daytime
			if (clouds < 10) {                    //sun
				icon_weather = "fa-sun";
				$("#weather_desc").html(this.translations.labels.weather_sunny_clear[this.language]);
			}
			else if (clouds < 80 && rain < 0.1) { //clouds sun no rain
				icon_weather = "fa-cloud-sun";
				$("#weather_desc").html(this.translations.labels.weather_broken_clouds[this.language]);
			}
			else if (clouds >= 80 && rain < 0.1) { //clouds no rain
				icon_weather = "fa-cloud";
				$("#weather_desc").html(this.translations.labels.weather_overcast_clouds[this.language]);
			}
			else if (clouds < 80 && rain > 0.1) {  //cloud sun rain
				icon_weather = "fa-cloud-sun-rain";
				$("#weather_desc").html(this.translations.labels.weather_light_rain[this.language]);
			}
			else if (clouds >= 80 && rain > 0.1) {  //cloud  rain
				icon_weather = "fa-cloud-rain";
				$("#weather_desc").html(this.translations.labels.weather_light_rain_overcast[this.language]);
			}
			else if (clouds >= 80 && rain > 1) {  //cloud  rain
				icon_weather = "fa-cloud-showers-heavy";
				$("#weather_desc").html(this.translations.labels.weather_shower_rain[this.language]);
			}
		}
		else { //night
			if (clouds < 10) {                    //moon
				icon_weather = "fa-moon";
				$("#weather_desc").html(this.translations.labels.weather_clear[this.language]);
			}
			else if (clouds < 80 && rain < 0.1) { //clouds moon no rain
				icon_weather = "fa-cloud-moon";
				$("#weather_desc").html(this.translations.labels.weather_broken_clouds[this.language]);
			}
			else if (clouds >= 80 && rain < 0.1) { //clouds no rain
				icon_weather = "fa-cloud";
				$("#weather_desc").html(this.translations.labels.weather_overcast_clouds[this.language]);
			}
			else if (clouds < 80 && rain > 0.1) {  //cloud moon rain
				icon_weather = "fa-cloud-moon-rain";
				$("#weather_desc").html(this.translations.labels.weather_light_rain[this.language]);
			}
			else if (clouds >= 80 && rain > 0.1) {  //cloud  rain
				icon_weather = "fa-cloud-rain";
				$("#weather_desc").html(this.translations.labels.weather_light_rain_overcast[this.language]);
			}
			else if (clouds >= 80 && rain > 1) {  //cloud  rain
				icon_weather = "fa-cloud-moon-rain";
				$("#weather_desc").html(this.translations.labels.weather_shower_rain[this.language]);
			}
		}
		
		$("#icon-weather").removeClass().addClass("fas").addClass(icon_weather);
	},
	getWeatherIcon: function(index){
		let clouds = this.knowledgeBase.thermalindices.ireq[index].clouds;
		let rain = this.knowledgeBase.thermalindices.ireq[index].rain;
		let solar = this.knowledgeBase.thermalindices.ireq[index].rad;

		// Weather descriptions aligned with https://openweathermap.org/weather-conditions
		
		let icon_weather = "fa-cloud-sun-rain";
		if (solar > 0) { //daytime
			if (clouds < 10) {                    //sun
				icon_weather = "\uf185";
			}
			else if (clouds < 80 && rain < 0.1) { //clouds sun no rain
				icon_weather = "\uf6c4";
			}
			else if (clouds >= 80 && rain < 0.1) { //clouds no rain
				icon_weather = "\uf0c2";
			}
			else if (clouds < 80 && rain > 0.1) {  //cloud sun rain
				icon_weather = "\uf743";
			}
			else if (clouds >= 80 && rain > 0.1) {  //cloud  rain
				icon_weather = "\uf73d";
			}
			else if (clouds >= 80 && rain > 1) {  //cloud heavy rain
				icon_weather = "\uf740";
			}
		}
		else { //night
			if (clouds < 10) {                    //moon
				icon_weather = "\uf186";
			}
			else if (clouds < 80 && rain < 0.1) { //clouds moon no rain
				icon_weather = "\uf6c3";
			}
			else if (clouds >= 80 && rain < 0.1) { //clouds no rain
				icon_weather = "\uf0c2";
			}
			else if (clouds < 80 && rain > 0.1) {  //cloud moon rain
				icon_weather = "\uf73c";
			}
			else if (clouds >= 80 && rain > 0.1) {  //cloud  rain
				icon_weather = "\uf73d";
			}
			else if (clouds >= 80 && rain > 1) {  //cloud heavy rain
				icon_weather = "\uf740";
			}
		}
		return icon_weather;
	},
	updateUTCI: function(index){
		var percentage = Math.ceil( 100.0 * index / this.maxForecast );
		$("#current_time").html( percentage + "% <i class='fas fa-spinner fa-pulse'></i>" );
		
		if( index === 0 ){
			this.knowledgeBase.thermalindices.utci = [];
		}
		console.log( "updateUTCI #"+index);
		var url="http://www.humanheat.exchange/api/get.php";
		var self = this;
		var data = {"models":"UTCI",
					"Tair": this.knowledgeBase.thermalindices.phs[index].Tair,
					"Trad": this.knowledgeBase.thermalindices.phs[index].Trad,
					"RH": this.knowledgeBase.thermalindices.phs[index].rh,
					"Vair": this.knowledgeBase.thermalindices.phs[index].v_air10,
					"api_key": "efb3f37f9952c58d2c7f47a08f2c2a62"};
		var utci_object = { "Tair": data.Tair,
							"utci_head": "UTCI unavailable",
							"utci_message":  "",
							"utci_temperature": 0,
							"utc": this.knowledgeBase.thermalindices.phs[index].utc};
		$.getJSON( url, data, function( answer ){
			
			if( answer.status_code == 200 ){
				utci_object = { "Tair": answer.input.environment.Tair,
								"utci_head": answer.results.UTCI.utci_head,
								"utci_message":  answer.results.UTCI.utci_message,
				 				"utci_temperature": answer.results.UTCI.utci_temperature};
			}
			self.knowledgeBase.thermalindices.utci[index] = utci_object;
			
			if( self.knowledgeBase.thermalindices.utci.length === self.maxForecast ){
				self.updateUI();
			}
			else{
				self.updateUTCI(index+1);
			}
		}).fail(function (e) {
			console.log("Failed humanheat.exchange: " + JSON.stringify(e));	
		});
	},
	convertWeatherToChartData: function ( thermal ) {
		var data;
		if( this.knowledgeBase.user.settings.index === "Climapp" ){
			data = {
				"labels": [],
				"values": { "points": [],
				 			"cold": [],
							"heat": [],
							"phs": []},//
				"ymin": 99999,
				"ymax": -9999,
			};
			var icl_worn = getClo(this.knowledgeBase);
			for (var i = 0; i < this.maxForecast; i++) {				
				//hot index
				var wbgt = this.knowledgeBase.thermalindices.phs[i].wbgt;
				var wbgt_risk_category = WBGTrisk(wbgt, this.knowledgeBase);
				//cold index
				var icl_min = this.knowledgeBase.thermalindices.ireq[i].ICLminimal;
				var icl_neutral = this.knowledgeBase.thermalindices.ireq[i].ICLneutral;
				var cold_index = this.calculateColdIndex(icl_neutral, icl_min, icl_worn, false); // minimal - worn, if negative you do not wear enough clothing
				
				var value = this.determineThermalIndexValue( cold_index, wbgt_risk_category, i, false );
				
				var phs_index = 120 / this.knowledgeBase.thermalindices.phs[i].D_Tre;
				
				var item = {
					x: new Date(this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					y: 1.0 * value//lower limit of green
				};
				
				var item_cold = {
					x: new Date(this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					y: 1.0 * -cold_index//mirror on x-axis cold index such that y=1 projects on y=-1
				};
				
				var item_heat = {
					x: new Date(this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					y: 1.0 * wbgt_risk_category//lower limit of green
				};
				var item_phs = {
					x: new Date(this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					y: 1.0 * phs_index//lower limit of green
				};
				
				data.labels.push(item.x);
				data.values.points.push(item);	
				data.values.cold.push(item_cold);	
				data.values.heat.push(item_heat);	
				data.values.phs.push(item_phs);	
				data.ymin = Math.min(data.ymin, 1.0 * value);
				data.ymax = Math.max(data.ymax, 1.0 * value);
				
			}
			
		}
		else{ //UTCI
			data = {
				"labels": [],
				"utci": { "points": [] },//
				"ymin": 99999,
				"ymax": -99999,
			};
			
			for (var i = 0; i < this.maxForecast; i++) {
				var utci = this.knowledgeBase.thermalindices.utci[i].utci_temperature;
				var item = {
					x: new Date(this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					y: 1.0 * utci
				};
				data.labels.push(item.x);
				data.utci.points.push(item);	
				data.ymin = Math.min(data.ymin, 1.0 * utci);
				data.ymax = Math.max(data.ymax, 1.0 * utci);
			}
		}
		
		return data;
	},
	drawChart: function (id, width, thermal, isDashboard) {
		var ctx = document.getElementById(id).getContext('2d');
		/*
		if ( !isDashboard && (ctx.canvas.width !== width || ctx.canvas.height !== width) ) {
			ctx.canvas.height = $(window).height() / 2.5;
			ctx.canvas.width = 0.95 * $(window).width();
		}
		else{
			ctx.canvas.height = 0.75 * $(window).width();
			ctx.canvas.width = 0.95 * $(window).width();
		}
		*/
		
		ctx.canvas.height = 0.5 * $(window).width();
		ctx.canvas.width = 0.95 * $(window).width();
		
		var data = this.convertWeatherToChartData( thermal );
		//console.log( "drawChart - data: " + JSON.stringify(data) );
		
		var x_from = data.labels[0];
		var x_to = data.labels[data.labels.length - 1];
		
		var levels = [];
		var max_y = 4;//cold level
		var min_y = -4;
		
		var green_y = 1;//0.8 * pal;
		var yellow_y = 2;//1.0 * pal;
		var orange_y = 3;//1.2 * pal;
		var red_y = Math.max( data.ymax, 4);//Math.ceil(Math.max(1.5 * pal, data.ymax + 1));
		 
		if( this.knowledgeBase.user.settings.index === "Climapp" ){
			max_y = red_y;
			min_y = Math.ceil( Math.min( -4, data.ymin - 1));
			
			levels.push( {
								label: "climapp index",
								backgroundColor: 'rgba(255,255,255,0.3)',
								borderColor: 'rgba(255,255,255,1)',
								borderWidth: 2,
								fill: false,
								data: data.values.points,
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							} );
			if( this.showExpertLegend ){
				levels.push( {
								label: "cold",
								backgroundColor: 'rgba(0,0,255,0.3)',
								borderColor: 'rgba(0,0,255,1)',
								borderWidth: 4,
								fill: false,
								data: data.values.cold,
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							});
				levels.push( {
								label: "heat",
								backgroundColor: 'rgba(255,0,0,0.3)',
								borderColor: 'rgba(255,0,0,1)',
								borderWidth: 4,
								fill: false,
								data: data.values.heat,
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							} );
			}
			
			levels.push( {
								label: "red",
								backgroundColor: 'rgba(180,0,0,.5)',
								borderColor: 'rgba(180,0,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: red_y }, { x: x_to, y: red_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
						
			levels.push( {
								label: "orange",
								backgroundColor: 'rgba(255,125,0,.5)',
								borderColor: 'rgba(255,125,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: orange_y }, { x: x_to, y: orange_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "yellow",
								backgroundColor: 'rgba(255,255,0,.5)',
								borderColor: 'rgba(255,255,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: yellow_y }, { x: x_to, y: yellow_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "green",
								backgroundColor: 'rgba(0,255,0,.5)',
								borderColor: 'rgba(0,255,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: green_y }, { x: x_to, y: green_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "cyan",
								backgroundColor: 'rgba(0,180,180,.5)',
								borderColor: 'rgba(0,180,180,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: -1 }, { x: x_to, y: -1 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "blue",
								backgroundColor: 'rgba(0,100,255,.5)',
								borderColor: 'rgba(0,100,255,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: -2 }, { x: x_to, y: -2 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "darkblue",
								backgroundColor: 'rgba(0,0,180,.5)',
								borderColor: 'rgba(0,0,180,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: -3 }, { x: x_to, y: -3 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
			levels.push( {
								label: "darkblue_min",
								backgroundColor: 'rgba(0,0,180,.5)',
								borderColor: 'rgba(0,0,180,1)',
								borderWidth: 2,
								fill: false,
								data: [{ x: x_from, y: min_y }, { x: x_to, y: min_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
						} );
		}
		else{//UTCI
						
			min_y = Math.ceil( Math.min( -40, data.ymin - 1));
			var red_y = Math.ceil(Math.max(46, data.ymax + 1 ));
			max_y = red_y;
			levels = [	{
								label: "utci",
								backgroundColor: 'rgba(255,255,255,0.3)',
								borderColor: 'rgba(255,255,255,1)',
								borderWidth: 2,
								fill: false,
								data: data.utci.points,
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "darkred",
								backgroundColor: 'rgba(125,0,0,.5)',
								borderColor: 'rgba(125,0,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: max_y }, { x: x_to, y: max_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							}, 
							{
								label: "red",
								backgroundColor: 'rgba(255,0,0,.5)',
								borderColor: 'rgba(255,0,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: 38 }, { x: x_to, y: 38 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "orange",
								backgroundColor: 'rgba(255,165,0,.5)',
								borderColor: 'rgba(255,165,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: 32 }, { x: x_to, y: 32 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "green",
								backgroundColor: 'rgba(0,255,0,.5)',
								borderColor: 'rgba(0,255,0,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: 26 }, { x: x_to, y: 26 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "cyan",
								backgroundColor: 'rgba(0,255,255,.5)',
								borderColor: 'rgba(0,255,255,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: 9 }, { x: x_to, y: 9 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "lightblue",
								backgroundColor: 'rgba(0,80,255,.5)',
								borderColor: 'rgba(0,80,255,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: 0 }, { x: x_to, y: 0 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "blue",
								backgroundColor: 'rgba(0,0,255,.5)',
								borderColor: 'rgba(0,0,255,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: -13 }, { x: x_to, y: -13 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "strongblue",
								backgroundColor: 'rgba(0,0,165,.5)',
								borderColor: 'rgba(0,0,165,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: -27 }, { x: x_to, y: -27 }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							},
							{
								label: "deepblue",
								backgroundColor: 'rgba(0,0,80,.5)',
								borderColor: 'rgba(0,0,80,1)',
								borderWidth: 2,
								fill: "+1",
								data: [{ x: x_from, y: min_y }, { x: x_to, y: min_y }],
								cubicInterpolationMode: 'monotone',
								pointRadius: 0,
								pointHoverRadius: 0
							}
							
						];
		}
		
		//console.log("drawChart fase 2");
		var fontsize = isDashboard ? '12' : '16';
		var tick_options = { display:true, fontSize: fontsize, fontColor: 'rgba(255, 255, 255, 1)', fontFamily: 'Lato', callback: function(value, index, values) { return '' + value; },max: max_y, min: min_y } ;
		var labelstr = thermal === "heat" ? this.translations.labels.str_heat_index[this.language]: this.translations.labels.str_cold_index[this.language];
		
		if( this.knowledgeBase.user.settings.index !== "Climapp" ){
			tick_options = { fontSize: fontsize, fontColor: 'rgba(255, 255, 255, 1)', fontFamily: 'Lato', max: max_y, min: min_y };
			labelstr = this.translations.labels.str_utci[this.language];
		}
		var chartData = {
			labels: data.labels,
			datasets: levels
		};
		var self = this;
		//console.log("drawChart fase 3 " + JSON.stringify(tick_options) );
		var myChart = null;
		myChart = new Chart(ctx, {
			type: 'line',
			data: chartData,
			options: {
				tooltips: {
					enabled: false,
					backgroundColor: 'rgba(80, 80, 20,0.8)',
					borderColor: 'rgba(0, 0, 0,1)',
					bodyFontFamily: 'Lato',
					callbacks : { // HERE YOU CUSTOMIZE THE LABELS
	                    title : function(tooltipItem, data) {
							
							var title = "";
							if( thermal === "heat"  ){
								var riskval = WBGTrisk( self.kb.thermalindices.phs[ tooltipItem[0].index ].wbgt, self.kb, true );
								title = gaugeTitleHeat( riskval, self.translations, self.language);
							}
							else{
								title = gaugeTitleCold( -Number( tooltipItem[0].value ), self.translations, self.language );
							}
							return title;
	                    },
	                    beforeLabel : function(tooltipItem, data) {
							let utc_date = new Date( tooltipItem.xLabel ); //
							let local_time = utc_date.toLocaleTimeString( navigator.language, { //language specific setting
								hour: '2-digit',
								minute: '2-digit'
							});
							return "tap more info for details";
	                    },
	                    label : function(tooltipItem, data) {
	                        return false;
	                    },
					}
		        },
				responsive: false,
				maintainAspectRatio: false,
				legend: false,
				scales: {
					yAxes: [{
						ticks: tick_options,
						gridLines: {
							color: 'rgba(255, 255, 255, 1)'
						},
						scaleLabel: {
							display: true,
							labelString: labelstr,
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato',
							fontSize: fontsize,
						}
					}],
					xAxes: [{
						type: 'time',
						distribution: 'series',
						time: {
						},
						ticks: {
							fontSize: fontsize,
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato',
							source: 'data'
						},
						gridLines: {
							color: 'rgba(255, 255, 255, 1)'
						},
						scaleLabel: {
							display: false,
							labelString: "Time",
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato'
						}
					}],

				},
				events: ['click'],
				animation: {
			        duration: 1,
			        onComplete: function () {
			            var chartInstance = this.chart,
			                ctx = chartInstance.ctx;
						var fontsize = '12px';
						const fonticon = '900 '+fontsize+' "Font Awesome 5 Free"';						
						const fonttext = '400 '+fontsize+' "Lato"';

						var onCompleteSelf = this;
			            ctx.textAlign = 'center';
			            ctx.textBaseline = 'bottom';
						// Chrome 76+ won't load the font
						// until it's needed by the ducument (i.e one of the characters is displayed)
						// or explicitely loaded through FontFaceSet API.
						document.fonts.load(fonticon).then((_) => {
							ctx.font = fonticon;
				            ctx.fillStyle = 'white';//"rbga(255,255,255,0.9)";
							//var dataset = onCompleteSelf.data.datasets[0];
	  			            var meta = chartInstance.controller.getDatasetMeta(0);
	  			            meta.data.forEach(function (bar, index) {
	  							var icon = self.getWeatherIcon( index ); 
	  							var offset_y = 15;//px 
	  							var temperature = self.knowledgeBase.thermalindices.ireq[ index ].Tair.toFixed(0) + '\u2103';
								
								ctx.font = fonticon;
								ctx.fillText(icon, bar._model.x, bar._model.y - offset_y); //above
								
								ctx.font = fonttext;
	  							ctx.fillText(temperature, bar._model.x, bar._model.y + 2*offset_y); //below								
	  			            });
							//onCompleteSelf.options.animation.onComplete = null;
							
						});
			        }
				}
			}
		});
		/*
		if( ctx.canvas.onclick == null ){
			ctx.canvas.onclick = function(event){
				var firstPoint = myChart.getElementAtEvent(event)[0];	
				if( firstPoint ){
					self.selectedWeatherID = firstPoint._index;
					self.updateInfo( firstPoint._index, false );
				}
			}
		}
		*/
		//console.log("drawChart finished");
		
	},
	drawGauge: function (id, width, value, key) {
		var c = $("#" + id),
			ctx = c[0].getContext('2d');

		if (ctx.canvas.width !== width || ctx.canvas.height !== width) {
			ctx.canvas.height = width;
			ctx.canvas.width = width;
		}
		var title = value < 0 ? gaugeTitleCold(Math.abs(value), this.translations, this.language) : gaugeTitleHeat(Math.abs(value), this.translations, this.language);
		var highlights = this.knowledgeBase.gauge.highlights;
		var gauge = new RadialGauge({
			renderTo: id,
			width: width,
			height: width,
			units: ' ',
			title: title,
			value: value, // making sure diff is reflected in gauge if any
			minValue: -4,
			maxValue: 4,
			startAngle: 45,
			ticksAngle: 270,
			majorTicks: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
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
			animationDuration: 3000,
			fontNumbersSize: 30,
			fontValueSize: 30,
		});
		gauge.draw();
	},
};

app.initialize();
