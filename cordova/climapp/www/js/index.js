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
		app.bindNotificationEvents();
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		this.loadSettings();
		if( this.knowledgeBase.user.guards.isFirstLogin ){//onboarding
			this.loadUI( "onboarding" );
		}
		else{
			this.loadUI( "dashboard" );
		}
		// Keeping track of how many time user has opened app, until count reaches 5
		if(this.knowledgeBase.user.guards.appOpenedCount < 5) {
			this.knowledgeBase.user.guards.appOpenedCount += 1;
		} 
		// After 5 times opening the app, the user is seen as advanced
		if(this.knowledgeBase.user.settings.level !== 2 && this.knowledgeBase.user.guards.appOpenedCount === 5) {
			this.knowledgeBase.user.settings.level = 2;
			showShortToast("After 5 uses you are now considered an experienced user.");
			
		}
		this.updateLocation();
		this.saveSettings();
	},
	bindNotificationEvents() {
		// When user clicks "open" the feedback screen is opened
		// This is the wanted behaviour, but currently not what happens.
		cordova.plugins.notification.local.on('feedback_yes', function (notification, eopts) { 
			self.loadUI('feedback');
		 });
	},
	initNavbarListeners: function(){
		// navigation menu
		var self = this;
		$("div[data-listener='navbar']").off();
		$("div[data-listener='navbar']").on("click", function(){
			let target = $( this ).attr("data-target");
			self.knowledgeBase.user.guards.isFirstLogin = 0;
		    self.saveSettings();
			if(self.firstTimeLoginWithoutPersonalization(target)) {
				showShortToast("Using default values in calculations.");
			}
			self.loadUI( target );
		});
	},
	initToggleListeners: function(){
		$("div[data-listener='toggle']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='toggle']").on("click", function() {
			let target = $(this).attr("data-target");
			$("#"+target).toggle();
		});
	},
	initFeedbackListeners: function() {
		var self = this;
		$("i[data-listener='reset_adaptation']").off(); //prevent multiple instances of listeners on same object
		$("i[data-listener='reset_adaptation']").on("click", function() {
			var mode = self.knowledgeBase.user.adaptation.mode;
			console.log("mode: " + mode);
			// Resetting diff
			self.knowledgeBase.user.adaptation[mode].diff = [0];
			self.saveSettings();
			showShortToast("Adaptation level reset to 0");
			let index = 0; // 0 = current situation -- is this what we want?
			
			self.getDrawGaugeParamsFromIndex(index, self.knowledgeBase, false ).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					self.drawGauge( 'feedback_gauge', width, personalvalue , thermal );
					$("#gauge_text_top_diff").html("Current personal alert level: 0");
					
					// Set the value as the perceived value in knowledgebase
			});

			// Update adaptation level and diff from prediction

		});


		$("div[data-listener='adaptation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='adaptation']").on('click', function() {
			var thermal = $( this ).attr("data-context");
			console.log("adaptation context: " + thermal);
			
			var currentPAL_ = self.knowledgeBase.user.adaptation[thermal].diff;
			var currentPAL = 0;
			if( currentPAL_.length > 0 ){
				currentPAL = currentPAL_[0];
			}
			console.log("OLD PAL : " + currentPAL);
			
			currentPAL += 1.0* $( this ).attr("data-value");
			self.knowledgeBase.user.adaptation[thermal].diff = [currentPAL];
			console.log("new PAL : " + currentPAL);
			
			// Draw gauge with current index value 
			let index = 0; // 0 = current situation -- is this what we want?
			self.getDrawGaugeParamsFromIndex(index, self.knowledgeBase, false).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//					
					self.drawGauge( 'feedback_gauge', width, personalvalue , thermal );
					$("#gauge_text_top_diff").html("Personal "+ thermal+" alert level: " + currentPAL );

					// Set the value as the perceived value in knowledgebase
					self.saveSettings();
			});
		});
		$("input[data-listener='slider']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='slider']").change(function() {

			var slider_value = this.value; 
		    self.knowledgeBase.user.guards.feedbackSliderChanged = 1;
			
			// Draw gauge with current index value 
			let index = 0; // 0 = current situation -- is this what we want?
			self.getDrawGaugeParamsFromIndex(index, self.knowledgeBase, false).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					self.drawGauge( 'feedback_gauge', width, slider_value , thermal );
					$("#gauge_text_top_current").html("Difference from system prediction: " + getSliderDiffFromSystemPrediction(self.knowledgeBase, thermal, slider_value));

					// Set the value as the perceived value in knowledgebase
					self.knowledgeBase.user.adaptation[thermal].perceived = slider_value;
					self.saveSettings();
			});
			self.saveSettings();
		});
		
		// When user rates the feedback questions
		$("input[data-listener='feedback']").off(); 
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
			let mode = self.knowledgeBase.user.adaptation.mode;
			self.knowledgeBase.feedback.comment = target;
			
			/*
			//BK: I commented out below code because adaptation[mode].diff is updated on click already - to be discussed further. 
			
			// Only push diff to array on submit, otherwise we assume user is content with adaptation level
			perceived_predicted_diff = (self.knowledgeBase.user.adaptation[mode].perceived -
			                            self.knowledgeBase.user.adaptation[mode].predicted);
			
			var diff_array = self.knowledgeBase.user.adaptation[mode].diff;

			if(perceived_predicted_diff !== "NaN") {
				diff_array.unshift(perceived_predicted_diff); 
			}
			*/
			
			
			// If user not in database, add user to database
			self.checkIfUserExistInDB();

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
			let currentValue = self.knowledgeBase.user.settings[target].toString();
			var config = {
			    title: title_,
			    items:[ [ items_ ] ],
			    positiveButtonText: "Done",
				negativeButtonText: "Cancel",
				wrapWheelText: true,
				/*defaultItems: [
					{index: 0, value: currentValue}
				]*/
			};
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.user.settings[target] = items_[result[0].index].value;
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
		
		console.log("adding settingslisteners on div[data-listener='tab']")
		$("div[data-listener='tab']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='tab']").on("click", function(){
			console.log("clicked");
			
			var target = $(this).attr("data-target");
			console.log(target);
			if(target === "reset") {
				// Resetting values to default
				self.knowledgeBase.user.settings.age = 30;
				self.knowledgeBase.user.settings.gender = "undefined";
				self.knowledgeBase.user.settings.height = 178;
				self.knowledgeBase.user.settings.weight = 82;
				self.knowledgeBase.user.settings.unit = "SI";
				self.knowledgeBase.user.settings.acclimatization = false;
				self.knowledgeBase.user.guards.receivesNotifications = false;

				self.saveSettings();
				self.updateUI();

				// Inform user about event in toast
				var notificationText = "Personal preferences reset, using default values.";
				showShortToast(notificationText);

			}
			else {
				self.loadUI(target);
			}
		});

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function(){
			var target = $(this).attr("data-target");
			
			if(target === "acclimatization_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.settings.acclimatization = isChecked;
				// Inform user about choice in toast
				var accText = isChecked ? "You are acclimatized to your working environment" : "You are not acclimatized to your working environment.";
				updateDBParam(self.knowledgeBase, "acclimatization");
				showShortToast(accText);

			} else if(target === "notification_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.guards.receivesNotifications = isChecked;
				// Inform user about choice in toast
				var notificationText = isChecked ? "You are receiving notifications!" : "You will not receive notifications.";
				showShortToast(notificationText);
			}
			self.saveSettings();
		});
	},
	initExploreListeners: function() {
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function(){
			var target = $(this).attr("data-target");
			let title_ = self.knowledgeBase.settings.custom[target + "_text"];
			var items_ = self.getSelectables( target );
			console.log(target + "    " + items_);

			var config = {
				title: title_,
				items:[ [ items_ ] ],
				positiveButtonText: "Done",
				negativeButtonText: "Cancel"
			};
					
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.settings.custom[target] = items_[result[0].index].value;
					
				console.log( target + ": " + items_[result[0].index].value);
				self.saveSettings(); 
				self.updateUI();
			}, function() {
				console.log('Canceled');
			});
		});
		
		$("div[data-listener='set_location']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='set_location']").on("click", function(){
			// Load Google Maps UI to set location on map
			self.loadUI("google_maps");
		});

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function(){
			var target = $(this).attr("data-target");

			if(target === "custom_input_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.guards.customInputEnabled = isChecked;
				// Inform user about choice in toast
				var customText = "";
				if(isChecked) {
					customText = "Custom input is enabled.";
					$("#customSection").show();
				 } else {  
					customText = "Custom input is disabled."; 
					$("#customSection").hide();
				}
				showShortToast(customText);
				self.saveSettings();
			}
		});

		$("div[data-listener='set_custom_options']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='set_custom_options']").on("click", function(){
			// Load UI using indoor options
			var target = $(this).attr("data-target");
			self.loadUI(target);
		});
	},
	initIndoorListeners: function() {
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function(){
			var target = $(this).attr("data-target");
			console.log(target);
			let title_ = self.knowledgeBase.settings.indoor[target + "_text"];
			var items_ = self.getSelectables( target );
			
			var config = {
				title: title_,
				items:[ [ items_ ] ],
				positiveButtonText: "Done",
				negativeButtonText: "Cancel"
			};
					
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.settings.indoor[target] = items_[result[0].index].value;
					
				console.log( target + ": " + items_[result[0].index].value);
				self.saveSettings(); 
				self.updateUI();
			}, function() {
				console.log('Canceled');
			});
		});

		$("input[data-listener='toggle_switch']").off(); //prevent multiple instances of listeners on same object
		$("input[data-listener='toggle_switch']").on("click", function(){
			var target = $(this).attr("data-target");

			if(target === "indoor_switch") {
				var isChecked = $(this).is(":checked");
				self.knowledgeBase.user.guards.isIndoor = isChecked;
				// Inform user about choice in toast
				var customText = "";
				if(isChecked) {
					customText = "Indoor mode enabled.";
					$("#indoorSection").show();
				 } else {  
					customText = "Indoor mode disabled."; 
					$("#indoorSection").hide();
				}
				showShortToast(customText);
				self.saveSettings();
			}
		});

		$("diiv[data-listener='set_indoor_options']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='set_indoor_options']").on("click", function(){
			// Load UI using indoor options
			var target = $(this).attr("data-target");
			self.loadUI(target);
		});
	},
	initGeolocationListeners: function(){
		var self = this;
		$("div[data-listener='geolocation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='geolocation']").on("touchstart", function(){
			self.updateLocation();
		});		
	},
	initDashboardListeners: function(){
		var self = this;
		$("div[data-listener='tab']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='tab']").on("click", function(){
			var target = $(this).attr("data-target");
			// Load feedback page when pressing gauge in dashboard
			self.loadUI(target);
		});
	},
	initDashboardSwipeListeners: function() {
		var self = this;
		$("div[data-listener='panel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='panel']").on({
			"swiperight": function(){
				var target = $(this).attr("data-target");
				self.dashBoardSwipeHelper("right", target);
			},
			"swipeleft": function(){
				var target = $(this).attr("data-target");
				self.dashBoardSwipeHelper("left", target);
			}
		});
		$("#forecast_right").off().on( "click", function(){				
			self.dashBoardSwipeHelper("left", "forecast");//right button is swipe left
		});
		$("#forecast_left").off().on( "click", function(){				
			self.dashBoardSwipeHelper("right", "forecast");//left button is swipe right
		});
		
	},
	dashBoardSwipeHelper: function( direction, target ){
		var self = this;
		console.log("selected weather id: " + this.selectedWeatherID);
		if( direction === "right"){
			if (target === "forecast"){
				if( this.selectedWeatherID === 0 ){
					this.updateLocation();
					$("#main_panel").fadeOut(2000, function(){});
				}
				else{
					this.selectedWeatherID = Math.max(0, this.selectedWeatherID-1);
					$("#main_panel").fadeOut(500, function(){
						self.updateInfo( self.selectedWeatherID );
					});
				}
			}else{
				this.loadUI(target);
			}
		}
		else{
			if (target === "forecast"){
				this.selectedWeatherID = Math.min( this.maxForecast, this.selectedWeatherID+1);				
				$("#main_panel").fadeOut(500, function(){
					self.updateInfo( self.selectedWeatherID );
				});
			}
		}
		
	},
	initActivityListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			let title_ = self.knowledgeBase[target].title;
			var items_ = self.getSelectables( target );
			
			var config = {
			    title: title_,
			    items:[ [ items_ ] ],
			    positiveButtonText: "Done",
			    negativeButtonText: "Cancel"
			};
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.user.settings[target+"_selected"] = items_[result[0].index].value;
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
			$("#selectheadgear").removeClass("hidden").addClass("hidden");
			$("#"+target).removeClass("hidden");			
		});	
	},
	initKnowledgeBase: function(){
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
					"customInputEnabled": false,
					"isIndoor": false
				}, 
				"settings": { // Using default values
					"age": 30,
					"height": 178,
					"weight": 82, 
					"gender": "undefined",
					"unit": "SI", 
					"acclimatization": false,
					"activity_selected": "medium",
					"clothing_selected": "Summer_attire",
					"headgear_selected": "none",
					"explore": false, // currently not used
					"level": 1 // 1 - beginner, 2 - advanced 
				},
				"adaptation": {
					"mode": "undefined",
					"heat": {
						"predicted": 0,
						"perceived": 0,
						"diff": [] // perceived - predicted
					},
					"cold": {
						"predicted": 0,
						"perceived": 0,
						"diff": [] // perceived - predicted
					}
				}
			},
			/* --------------------------------------------------- */
			"version": 2.0397,
			"app_version": "beta",
			"server": {
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
								"unit": "years"
						 		},
						 "height": {"title": "How tall are you?"
								},
						 "weight": {"title": "How much do you weigh?"
								},
						 "gender": {"title": "What is your gender?"
								},
						 "unit": { "title": "Which units of measurements would you prefer?"
								}, 
						 "custom": { "title": "Do you want to input custom location and climatic values for the app to use?", 
								"value": 0 ,
								"coordinates_lon": 0,
								"coordinates_lat": 0,
								"coordinates_text": "Input the wanted coordinates",
								"_temperature": 0,
								"_temperature_text": "Input the temperature you want to use",
								"windspeed": 0,
								"windspeed_text": "Input the windspeed you would like to use",
								"_humidity": 0,																	 
								"_humidity_text": "Input the humidity you would like to use"					
							   },
						 "indoor": {
							 	"thermostat_level": 0,
								"thermostat_level_text" : "What is your thermostat set to?",
								"open_windows": 0,
								"open_windows_text" : "Are there any open windows in the room?"
						 }	   
					   },
			"activity": { "title": "What is your activity level?",
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
							}
						},
			   			"clothing": { "title": "What kind of clothing are you wearing?",
				  			"description": {	"Summer_attire": "Loose fitting, short clothing. Typical for summer.",
								 				"Business_suit":"Regular business suit. Most common in offices.",
												"Double_layer": "Generally taken to be coveralls over work clothes.",
												"Cloth_coverall": "Woven fabric that includes treated cotton.",
												"Cloth_apron_long_sleeve": "The wrap-around apron configuration was designed to protect the front and sides of the body against spills from chemical agents.",
												"Vapour_barrier_coverall": "Vapour-barrier clothing in a single layer.",
								 				"Winter_attire":"Winter clothing, multiple layers including a thick coat." 
							},
							"label": {  "Summer_attire": "Summer attire", //ISO 8896
										"Business_suit": "Business suit",
										"Double_layer": "Double layer",
										"Cloth_coverall": "Cloth coverall",
										"Cloth_apron_long_sleeve": "Apron over coverall",
										"Vapour_barrier_coverall": "Vapour-barrier coverall",
										"Winter_attire": "Winter attire"
							},
							"values": { "Summer_attire": 0.5, //clo
										"Business_suit": 1.0,
										"Double_layer": 1.5,
										"Cloth_coverall": 1.0,
										"Cloth_apron_long_sleeve": 1.2,
										"Vapour_barrier_coverall": 1.1,
										"Winter_attire": 2.5
							}	
						},
			   			"headgear": { "title": "Are you wearing any headgear?",
				  			"description": {	"none": "No headgear",
								 				"helmet":"Wearing a hood of any fabric with any clothing ensemble.",
							},
							"label": { "none": "None", //ISO 8896
										"helmet": "Helmet or hood",
							},
							"values": { "none": 0, //clo
										"helmet": 0.1, //clo
							}	
						},
						"feedback": { 
							"gauge": {
								"text_top": "Your predicted score",
								"text_bottom": "Tap the buttons to adjust the gauge to your thermal experience."
							},
							"question1": { 
								"text": "How were your drinking needs?",
								"rating": 3, 
								"ratingtype": "ratingbar",
								"ratingtext": {
									"5": "Much higher than expected",
									"4": "Higher than expected",
									"3": "Normal",
									"2": "Lower than expected",
									"1": "Much lower than expected"
								},
							}, 
							"question2": {
								"text": "Did you take more breaks today than you expected?",
								"rating": 3, 
								"ratingtype": "ratingbar",
								"ratingtext": {
									"5": "A lot more exhausted than usual",
									"4": "More exhausted than usual",
									"3": "Normal",
									"2": "Less exhausted than usual",
									"1": "Not exhausted at all",
								},
							},
							"question3": {
								"text": "How would you evaluate the amount of clothing you wore today?",
								"rating": 3, 
								"ratingtype": "ratingbar",
								"ratingtext": {
									"5": "A lot more than needed",
									"4": "A little too much clothing",
									"3": "I wore the right amount of clothing",
									"2": "Less than needed",
									"1": "Much less than needed"
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
						        { from: 3, to: 4, color:  'rgba(150,0,0,.9)', css:'veryhot'},
						        { from: 2, to: 3, color: 'rgba(255,165,0,.9)', css:'hot'},
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
							"duration": 180, //minutes (required for PHS)
						},
					};
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "./pages/dashboard.html",
						 "forecast": "./pages/forecast.html",
						 "settings": "./pages/settings.html",
						 "feedback": "./pages/feedback.html",
		 				 "onboarding": "./pages/onboarding.html",
		 				 "disclaimer": "./pages/disclaimer.html",
						 "details": "./pages/details.html",
						 "about": "./pages/about.html",
						 "custom_input": "./pages/custom_input.html",
						 "indoor": "./pages/indoor.html",
						 "google_maps": "./pages/google_maps.html"};
		this.selectedWeatherID = 0;
		this.maxForecast = 8; //8x3h = 24h
		var shadowKB = this.initKnowledgeBase();
		var msgString = ""; // String deciding message to show in console/toast

		// Distinguishing between a new and an existing user
		if (localStorage.getItem("knowledgebase_v2") === null ) {
			// For all users with a different (older) version of the knowledgebase
			if(localStorage.getItem("knowledgebase") !== null) {
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
			this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase_v2") );
			
			if ( 'version' in this.knowledgeBase && this.knowledgeBase.version < shadowKB.version ){
				// Saving user preferences before updating
				var userPreferences = this.knowledgeBase.user;   // Store old user data in temporary variable
				this.knowledgeBase = shadowKB;                   // Update knowledgebase to new version
				var mergedUserPreferences = MergeRecursive(shadowKB.user, userPreferences); // merge old user data into new user object
				this.knowledgeBase.user = mergedUserPreferences; // Add merged user data to knowledgebase

				if(typeof this.knowledgeBase.user.adaptation.heat.diff === 'number' || typeof this.knowledgeBase.user.adaptation.cold.diff === 'number' ){
                    this.knowledgeBase.user.adaptation.heat.diff = [];
                    this.knowledgeBase.user.adaptation.cold.diff = [];
				}

				msgString = "Knowledge base updated to version: ";
			}
			else if ('version' in this.knowledgeBase && this.knowledgeBase.version == shadowKB.version){
				msgString = "Loaded knowledge base version: ";
			}
			else { //old version does not have version key
				this.knowledgeBase = shadowKB;
				msgString = "Knowledge base updated to version: ";
			}
		}
		else {
			this.knowledgeBase = shadowKB;	
			msgString = "Created knowledge base version: ";
		}
		console.log(msgString + this.knowledgeBase.version);
		showShortToast(msgString + this.knowledgeBase.version);
		this.saveSettings();
		console.log("User settings: \n" + JSON.stringify(this.knowledgeBase.user)); // Showing current user settings
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
		return self.knowledgeBase.user.guards.isFirstLogin && target === 'dashboard';
	},
	getSelectables: function( key ){
		var self = this;
		let unit = this.knowledgeBase.user.settings.unit;
		var obj_array = [];

		if( key.slice(0, 3) === "age" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+12) + " years", value: (i+12) });
			}
		}
		else if( key === "height" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.user.settings.unit === "SI") {
					obj_array.push({description: (i+120) + " " + getHeightUnit(unit), value: (i+120)  } );
				} else { // feet, inches (still want to save in cm, not changing value)
					obj_array.push({description: ((i+120)/30.48).toFixed(1) + " " + getHeightUnit(unit), value: (i+120)  } );
				}
			}
		}
		else if( key === "weight" ){
			for( var i=0; i<100; i++){
				if(this.knowledgeBase.user.settings.unit === "SI") {
					obj_array.push({description: (i+40) + " " + getWeightUnit(unit), value: (i+40) } );
				} else if (this.knowledgeBase.user.settings.unit === "US") {
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
			obj_array.push({description: "SI: kg, cm, m/s, Celsius", value: "SI" } );
			obj_array.push({description: "US: lbs, inch, m/s, Fahrenheit", value: "US" } );
			obj_array.push({description: "UK: stone, inch, m/s, Celsius", value: "UK" } );
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
			$.each( this.knowledgeBase.clothing.label, function(key,val ){
				obj_array.push({description: val, value: key} );
			});
		}
		else if( key === "headgear" ){
			$.each( this.knowledgeBase.headgear.label, function(key,val ){
				obj_array.push({description: val, value: key} );
			});
		}
		else if (key === "activity"){
			$.each( this.knowledgeBase.activity.label, function(key,val ){
				obj_array.push({description: val, value: key} );
			});
		}

		/* CUSTOM INPUT */
		else if(key === "custom_input" || key === "open_windows") {
			obj_array.push({description: "Yes", value: 1 } );
			obj_array.push({description: "No", value: 0 } );
		}
		else if(key === "coordinates") {
			// Opening Google Maps API to get location in new window.
			self.loadUI("google_maps");
		}
		else if(key === "_temperature") {
			if(this.knowledgeBase.user.settings.unit !== "SI") {
				// Fahrenheit
				for(var i = 200; i >= -40; i--) {
					let convertedTemp = getTemperatureValueInPreferredUnit(i, "US");
					obj_array.push({description: convertedTemp.toFixed(1) + " &#xb0 F", value: convertedTemp.toFixed(1)});
				}
			} else {
				// Celcius
				for(var j = -30; j <= 60; j++) {
					obj_array.push({description: j + " &#xb0  C", value: j});
				}
			}
		}
		else if(key === "_humidity") {
			for(var i = 0; i <= 100; i+= 10) {
				obj_array.push({description: i + " %", value: i});
			}
		}
		// using logic for windspeed above

		/* INDOOR MODE */
		else if(key === "thermostat_level") {
			for(var i = 1; i <= 5; i++) {
				obj_array.push({description: i, value: i });
			}
		}
		// logic for windows in custom output section
		return obj_array;
	},
	saveSettings: function(){
		let jsonData = JSON.stringify( this.knowledgeBase );
		localStorage.setItem("knowledgebase_v2", jsonData ); // saving to new version for easier logic
	},
	updateLocation: function(){
		//$('i.fa-sync-alt').toggleClass("fa-spin");
		var self = this; //copy current scope into local scope for use in anonymous function 
		let options = {timeout: 30000 };
		console.log("updating location");
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

		self.checkIfUserExistInDB().then((result) => {
			getAppIDFromDB(self.knowledgeBase).then((appidFromServer) => {
				
				if(appidFromServer) { 
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
								self.knowledgeBase.weather.station = weather.station;
								self.knowledgeBase.weather.distance = weather.distance ? weather.distance : 0;
								self.knowledgeBase.weather.utc = "utc" in weather ? weather.utc : weather.dt;
								
								//returns current weather by default in key "weather.currentweather"
								//prepend to array.
								console.log( JSON.stringify(weather));
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
								
								self.knowledgeBase.weather.wbgt_max = weather.wbgt_max.map(Number);
								self.knowledgeBase.weather.wbgt_max.unshift( Number( weather.currentweather.wbgt_max ) );
								
								
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
										var Tg = self.knowledgeBase.weather.globetemperature[key];
										var Ta = self.knowledgeBase.weather.temperature[key];
										var va = vair * Math.pow( 0.2, 0.25 ); //stability class D Liljgren 2008 Table 3
										
										//kruger et al 2014
										var D = 0.05; //diameter black globe (liljegren - ) --default value = 0.15
										var eps_g = 0.95; //standard emmisivity black bulb
										var t0 = (Tg+273.0);
										var t1 = Math.pow( t0, 4);
										var t2 = 1.1 * Math.pow(10,8) * Math.pow( va, 0.6 ); 
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
										let wvp = 0.1 * ( val * 0.01) * Math.exp( 18.965 - 4030/(T+235));	
										self.knowledgeBase.weather.watervapourpressure.push( wvp );	
								}); 
								
								self.saveSettings();
								self.calcThermalIndices();
								self.updateUI();
										
								// Only update when weather data has been received - and when external DB record is present.
								if( self.knowledgeBase.user.guards.hasExternalDBRecord ){
										addWeatherDataToDB(self.knowledgeBase);
								}	
							}
							catch( error ){
								console.log( error );
							}
					}).fail(function( e ) {
						console.log("fail in weather "+ e);
					});
				} else  {
					showShortToast("Failed to update weather, no app ID.");
				}		
			}); // Making code execution wait for app id retrieval
		});
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
	checkIfUserExistInDB: async function() {
		var self = this;
		if(!self.knowledgeBase.user.guards.hasExternalDBRecord && typeof(self.knowledgeBase.user.guards.hasExternalDBRecord) !== 'undefined') {
			createUserRecord(self.knowledgeBase).then((userCreatedInDB) => {
				// Only update value on success
				if(userCreatedInDB) {
					console.log("User added to database.");
					self.knowledgeBase.user.guards.hasExternalDBRecord = 1;
					self.saveSettings();
				}
			});
		} else {
			console.log("User exist in database.");
		}
	},
	calcThermalIndices: function( ){
		this.knowledgeBase.thermalindices.ireq = [];
		this.knowledgeBase.thermalindices.phs = [];
		
		var options =  {air:{},
						body:{
									"M": 		M(this.knowledgeBase), 	//W/m2 
									"work": 	0,		//W/m2 external work 
									"posture": 	2,		//1= sitting, 2= standing, 3= crouching
									"weight":   this.knowledgeBase.user.settings.weight,		//kg  
									"height": 	this.knowledgeBase.user.settings.height / 100,	//m
									"drink": 	0,	// may drink freely
									"accl": 	0		//% acclimatisation state either 0 or 100						
							},
							cloth:{
									"Icl": 		getClo(this.knowledgeBase), 	//clo
									"p": 		getAirPermeability(this.knowledgeBase), 	// Air permeability (low < 5, medium 50, high > 100 l/m2s)
									"im_st": 	getMoisturePermeability(this.knowledgeBase), 	// static moisture permeability index
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
				"wbgt_max": self.knowledgeBase.weather.wbgt_max[index],
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
				"wbgt_max": self.knowledgeBase.weather.wbgt_max[index],
				"windchill": self.knowledgeBase.weather.windchill[index],
				"utc": self.knowledgeBase.weather.utc[index],
			};
			self.knowledgeBase.thermalindices.phs.push( phs_object );	
		});
	},
	updateUI: async function(){
		// context dependent filling of content
		this.initNavbarListeners();
		$(".navigation_back_settings").hide();
		$(".navigation_back_dashboard").hide();
		$(".navigation_back_custom").hide();
		
		if( this.currentPageID == "onboarding"){
			$(".navigation").hide();
		}
		else if( this.currentPageID == "dashboard" ){
			$(".navigation").show();
			$("#main_panel").show();
			$("#tip_panel").show();

			this.initDashboardListeners();
			this.initDashboardSwipeListeners();
			this.initGeolocationListeners();
			this.initActivityListeners();
			this.initMenuListeners();
			this.initToggleListeners();
			
			this.updateMenuItems();
			
			this.updateInfo( this.selectedWeatherID );

			// Giving the user an introduction of the dashbord on first login
			if(!this.knowledgeBase.user.guards.introductionCompleted) {
				startIntro();
				this.knowledgeBase.user.guards.introductionCompleted = 1;
				this.saveSettings();
			}
		}
		else if( this.currentPageID == "details"){
			$(".navigation").hide();
			$(".navigation_back_dashboard").show();
			var index = this.selectedWeatherID;
			
			this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, true ).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {
					let tair = this.knowledgeBase.thermalindices.phs[index].Tair.toFixed(1);
					let rh = this.knowledgeBase.thermalindices.phs[index].rh.toFixed(0);
					let clouds = this.knowledgeBase.thermalindices.phs[index].clouds.toFixed(0);
			
					let rad = this.knowledgeBase.thermalindices.phs[index].rad.toFixed(0);
					let vair10 = this.knowledgeBase.thermalindices.phs[index].v_air10.toFixed(1);
					let vair2 = this.knowledgeBase.thermalindices.phs[index].v_air.toFixed(1);
					let tmrt = this.knowledgeBase.thermalindices.phs[index].Trad.toFixed(1);
					let tglobe = this.knowledgeBase.thermalindices.phs[index].Tglobe.toFixed(1);
			
					let wbgt = this.knowledgeBase.thermalindices.phs[index].wbgt.toFixed(1);
					let wbgt_eff = getWBGTeffective( wbgt, this.knowledgeBase );
					let ral = RAL( this.knowledgeBase );
					let pal = getPAL( this.knowledgeBase, thermal);
					let personal_ral = ral - pal;
			
					let windchill = this.knowledgeBase.thermalindices.phs[index].windchill.toFixed(1);
			
					let M = this.knowledgeBase.thermalindices.phs[index].M.toFixed(0);
					let A = BSA( this.knowledgeBase ).toFixed(1);
			
					let Icl = (0.155 * this.knowledgeBase.thermalindices.phs[index].Icl);
					Icl = Icl.toFixed(3);

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
					$("#detail_wbgt_eff").html( wbgt_eff.toFixed(1) + "&deg;C");
					$("#detail_ral").html( ral.toFixed(1) + "&deg;C");
					$("#detail_ral_pal").html( ral.toFixed(1) + "&deg;C");
			
					$("#detail_windchill").html(windchill + "&deg;C");
			
					$("#detail_metabolic").html(M + "W/m<sup>2</sup>");
					$("#detail_area").html(A + "m<sup>2</sup>")
			
					$("#detail_icl").html(Icl + "m<sup>2</sup>K/W");
					$("#detail_p").html(p);
					$("#detail_im").html(im);
			
					let icl_min = this.knowledgeBase.thermalindices.ireq[ index].ICLminimal;
					let icl_worn = getClo(this.knowledgeBase);
					let cold_index = icl_min - icl_worn; // minimal - worn, if negative you do not wear enough clothing
	
					let heat_index = WBGTrisk( wbgt, this.knowledgeBase );
			
					let draw_cold_gauge = this.isDrawColdGauge( icl_min, heat_index, index );
					let draw_heat_gauge = this.isDrawHeatGauge( icl_min, heat_index, index );
					let isNeutral = !draw_cold_gauge && !draw_heat_gauge;
			
					
					$("#moreinformation").html( tip_html );
				
					
					if( personalvalue <= -1 ){
						$("div[data-context='heat'],div[data-context='phs'],div[data-context='neutral']").hide();
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
				
						let activity = this.knowledgeBase.user.settings.activity_selected;
						$("#detail_activity_ireq").html(activity);
						$("#detail_icl_max").html( icl_max );
						$("#detail_icl_min").html( icl_min );
				
						let minicon = clothingIcon( icl_min);
						let maxicon = clothingIcon( icl_max);
				
						$("#detail_min_clo").html("<img src='"+minicon+"' class='small'/>");
						$("#detail_max_clo").html("<img src='"+maxicon+"' class='small'/>");
				
						$("#detail_dle_ireq").html( dle_min );	
					}
					else if( personalvalue >= 1  ){
						$("div[data-context='cold'],div[data-context='phs'],div[data-context='neutral']").hide();
						$("div[data-context='heat']").show();
				
				
						$("#detail_wbgt_iso7243").html( wbgt_eff.toFixed(1) );
						$("#detail_ral_iso7243").html( ral.toFixed(1) );
				
						if( wbgt_eff >= (ral-pav) ){
							$("div[data-context='phs']").show();
							let d_tre = this.knowledgeBase.thermalindices.phs[ index].D_Tre ? this.knowledgeBase.thermalindices.phs[ index].D_Tre : ">120";
							let d_sw = this.knowledgeBase.thermalindices.phs[ index].Dwl50;
							let sw_tot_per_hour = 0.001 * this.knowledgeBase.thermalindices.phs[ index].SWtotg / 
							(this.knowledgeBase.sim.duration / 60 ); //liter per hour
							sw_tot_per_hour = sw_tot_per_hour.toFixed(1);
				
							$("#detail_sweat").html( sw_tot_per_hour );
							$("#detail_dle_phs").html( d_tre );
						}

					}
					else{
						$("div[data-context='cold'],div[data-context='phs'],div[data-context='heat']").hide();
						$("div[data-context='neutral']").show();
					}
			});
			
		}
		else if( this.currentPageID == "settings" ){
			$(".navigation").show();
			this.initSettingsListeners();
			let unit = this.knowledgeBase.user.settings.unit;
			let height = this.knowledgeBase.user.settings.height;
			let weight = this.knowledgeBase.user.settings.weight;

			$("#age").html(this.knowledgeBase.user.settings.age + " " + this.knowledgeBase.settings.age.unit);
			$("#height").html(getCalculatedHeightValue(unit, height) + " " + getHeightUnit(unit));
			$("#weight").html(getCalculatedWeightValue(unit, weight) + " " + getWeightUnit(unit));
			$("#gender").html(this.knowledgeBase.user.settings.gender);
			$("#unit").html(this.knowledgeBase.user.settings.unit + " units" );
			$("#acclimatization_checkbox").prop("checked", this.knowledgeBase.user.settings.acclimatization);
			$("#notification_checkbox").prop("checked", this.knowledgeBase.user.guards.receivesNotifications);
		}
		else if( this.currentPageID == "feedback" ){
			$(".navigation").hide();
			$(".navigation_back_settings").show();
			this.initToggleListeners();
			this.initFeedbackListeners();
			this.knowledgeBase.user.guards.feedbackSliderChanged = 0;

			// Draw gauge with current index value 
			let index = 0; // 0 = current situation -- is this what we want? -BK tricky tbd
			this.getDrawGaugeParamsFromIndex(index, this.knowledgeBase, false ).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					$("#gauge_text_top_diff").hide();
					this.drawGauge( 'feedback_gauge', width, personalvalue, thermal );
					this.knowledgeBase.user.adaptation.mode = thermal;
					// Save current gauge value as original value
					this.knowledgeBase.user.adaptation[thermal].predicted = modelvalue;
					this.saveSettings();
					var diff_array = this.knowledgeBase.user.adaptation[thermal].diff; 
					// Set text around gauge and slider
					$("#gauge_text_top").html(this.knowledgeBase.feedback.gauge.text_top);
					if(diff_array.length >= 1) {
						$("#gauge_text_top_diff").show();
						$("#gauge_text_top_diff").html("Personal "+thermal+" alert level: " + diff_array[0].toFixed(1));
					}

					$("#gauge_text_bottom").html(this.knowledgeBase.feedback.gauge.text_bottom);
					
					$("div[data-listener='adaptation']").attr("data-context", thermal);
					
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
			});
		} 
		else if(this.currentPageID == "forecast") {
			//
			this.initActivityListeners();
			this.initMenuListeners();
			this.updateMenuItems();
			let index = 0;//does not really matter, thermal and width are required
			this.getDrawGaugeParamsFromIndex( index , this.knowledgeBase, false ).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {
					this.drawChart( "forecast_canvas", width, thermal );
				});
		} 
		else if(this.currentPageID == "about") {
			$(".navigation").hide();
			$(".navigation_back_settings").show(); //BK: class used as id - consider using id - #navigation_back_settings instead of .
			$("#app_version").html("App version: " + this.knowledgeBase.app_version);
			$("#kb_version").html("Knowledge base version: " + this.knowledgeBase.version);
		} 
		else if (this.currentPageID == "disclaimer") {
			$(".navigation").hide();
			$(".navigation_back_settings").show();
		}
		else if (this.currentPageID == "custom_input") {
			$(".navigation_back_dashboard").show();
			$("#custom_input_checkbox").prop("checked", this.knowledgeBase.user.guards.customInputEnabled);
			this.knowledgeBase.user.guards.customInputEnabled ? $("#customSection").show() : $("#customSection").hide(); 
			this.initExploreListeners();

			var tempUnit = this.knowledgeBase.user.settings.unit === "US" ? "F" : "C";

			$("#coordinates").html( "lon: " + this.knowledgeBase.settings.custom.coordinates_lon + " lat: " + this.knowledgeBase.settings.custom.coordinates_lon);
			$("#_temperature").html( this.knowledgeBase.settings.custom._temperature + " &#xb0 " + tempUnit);
			$("#windspeed").html( this.knowledgeBase.settings.custom.windspeed);
			$("#_humidity").html(this.knowledgeBase.settings.custom._humidity + " %");
		}
		else if (this.currentPageID == "indoor") {
			$(".navigation_back_dashboard").show();
			$("#indoor_checkbox").prop("checked", this.knowledgeBase.user.guards.isIndoor);
			this.knowledgeBase.user.guards.isIndoor ? $("#indoorSection").show() : $("#indoorSection").hide(); 
			this.initIndoorListeners();
			var windowsOpen = this.knowledgeBase.settings.indoor.open_windows ? "Yes" : "No";

			$("#thermostat_level").html(this.knowledgeBase.settings.indoor.thermostat_level);
			$("#open_windows").html(windowsOpen);
		}
		else if (this.currentPageID === "google_maps") {
			$(".navigation").hide();
			$(".navigation_back_custom").show();
		}
	},
	updateMenuItems: function(){
		let selected = this.knowledgeBase.user.settings.activity_selected;
		$("#dashboard_activity").html( this.knowledgeBase.activity.label[ selected ] );
		let caption_ = this.knowledgeBase.activity.description[ selected ];
		$("#activityCaption").html( caption_ );

		selected = this.knowledgeBase.user.settings.clothing_selected;			
		$("#dashboard_clothing").html( this.knowledgeBase.clothing.label[ selected ] );
		 caption_ = this.knowledgeBase.clothing.description[ selected ];
		$("#clothingCaption").html( caption_ );

		selected = this.knowledgeBase.user.settings.headgear_selected;			
		$("#dashboard_headgear").html( this.knowledgeBase.headgear.label[ selected ] );
		 caption_ = this.knowledgeBase.headgear.description[ selected ];
		$("#headgearCaption").html( caption_ );
	},
	getDrawGaugeParamsFromIndex: async function(index, kb, leveloverride ) {
		
		console.log( "getDrawGaugeParamsFromIndex " + index );
		let icl_min = kb.thermalindices.ireq[index].ICLminimal;
		let icl_worn = getClo(kb);
		let cold_index = icl_min - icl_worn; // minimal - worn, if negative you do not wear enough clothing
		
		console.log( "cold_index " + cold_index );
		
		let personal_heat_index = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, true );
		
		console.log( "personal_heat_index " + personal_heat_index );
		
		let model_heat_index = WBGTrisk( kb.thermalindices.phs[index].wbgt, kb, false );
		
		console.log( "model_heat_index " + model_heat_index );
		
		
		let draw_cold_gauge = this.isDrawColdGauge( cold_index, personal_heat_index, index );
		let draw_heat_gauge = this.isDrawHeatGauge( cold_index, personal_heat_index, index );
		let isNeutral = !draw_cold_gauge && !draw_heat_gauge;
		let tip_html = "";
		let thermal = draw_cold_gauge ? "cold" : "heat";
		let level = leveloverride ? 2 : kb.user.settings.level;
		
		console.log( "level " + level );
		
		let personal_value = this.determineThermalIndexValue( cold_index, personal_heat_index, index );
		let model_value = this.determineThermalIndexValue( cold_index, model_heat_index, index );
	
	
		console.log( "personal_value " + personal_value );
		console.log( "model_value " + model_value );
	
		if( draw_cold_gauge || ( isNeutral && cold_index > personal_heat_index ) ) {
			tip_html += coldLevelTips( index, level, kb, cold_index, this.currentPageID );
		}
		else{
			var fromThermalAdvisor = await heatLevelTips( index, level, kb, this.currentPageID );
			tip_html += fromThermalAdvisor;
		}
		console.log("tips " + tip_html);
		let windowsize = $( window ).width();
		let width = windowsize / 2.5;

		// Schedule a notification if weather conditions are out of the ordinary (more than 2 or ess -1)
		let lowerLimit = -1; // TODO: we need to decide on these values
		let upperLimit = 2;
		if(personal_value < lowerLimit || personal_value > upperLimit) {
			if(kb.user.guards.receivesNotifications) {
				//this.scheduleDefaultNotification();
			} else {
				console.log("User has opted out of notifications.");
			}
		}
		return [width, personal_value, model_value, thermal, tip_html];
	},
	getDiff: function(kb, thermal){
		// This lgoci is also used in dashboard.js function: heatlevelTips
		getPAL( kb, thermal );
	},
	// ireq only valid with temperatures less than 10
	isDrawColdGauge: function( cold, heat, index ){
		return cold >= heat
			   &&
			   this.knowledgeBase.thermalindices.ireq[ index].Tair <= 10;
	},
	isDrawHeatGauge: function( cold, heat, index ){
 	   return heat > cold
		      && this.knowledgeBase.weather.wbgt[ index ] > 15;
	},
	determineThermalIndexValue: function( cold, heat, index ){
		let value = cold > heat ? -cold : heat;
		// why is the variable value used to calculate both cold and heat gauge?? faulty logic 
		// (can you use the value as you overwrite it?)
		
		//bk: the thermal index is either a hot or cold one, both are defined differntly. 
		// this function unifies the thermal index value. it is either -cold if it is cold, or heat if it is hot.
		//by default it is the largest one (if cold > heat -> then cold etc)
		value = this.isDrawColdGauge( cold, heat, index ) ? -cold : value;
		value = this.isDrawHeatGauge( cold, heat, index ) ? heat : value;
		return Math.max( -4, Math.min( 4, value  ) );//value between -4 and +4
	},
	updateInfo: function( index ){
		var self = this;
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
			
			$("#temperature").html(getTemperatureValueInPreferredUnit(this.knowledgeBase.thermalindices.ireq[ index].Tair, this.knowledgeBase.user.settings.unit).toFixed(0) +"&#xb0");
			let ws = this.knowledgeBase.thermalindices.ireq[index].v_air10 * 3.6; //m/s to km/h
			$("#windspeed").html( ws.toFixed(0) );
			$("#temp_unit").html(getTemperatureUnit(this.knowledgeBase.user.settings.unit)); 
			$("#humidity").html(  this.knowledgeBase.thermalindices.ireq[index].rh.toFixed(0) );

			// Indicate indoor/outdoor mode on dashboard
			let isIndoor = this.knowledgeBase.user.guards.isIndoor ? "Indoor" : "Outdoor";
			$("#indoor_outdoor").html(isIndoor);
			
			//weather icon
			let clouds = this.knowledgeBase.thermalindices.ireq[index].clouds;
			
			
			let rain = this.knowledgeBase.thermalindices.ireq[index].rain;
			let solar = this.knowledgeBase.thermalindices.ireq[index].rad; 
			
			/*
			save code for later use
			
			var video = $('#bgvideo')[0];
			video.src = "./video/rain.mp4";
			video.load();
			video.play();
			function */
			
			// Weather descriptions aligned with https://openweathermap.org/weather-conditions
			let icon_weather = "fa-cloud-sun-rain";
			if( solar > 0 ){ //daytime
				if( clouds < 10 ){                    //sun
					icon_weather = "fa-sun";
					$("#weather_desc").html("Sunny, clear sky");
				}
				else if( clouds < 80 && rain < 0.1 ){ //clouds sun no rain
					icon_weather = "fa-cloud-sun";
					$("#weather_desc").html("Broken clouds");
				}
				else if( clouds >= 80 && rain < 0.1 ){ //clouds no rain
					icon_weather = "fa-cloud";
					$("#weather_desc").html("Overcast clouds");
				} 
				else if( clouds < 80 && rain > 0.1 ){  //cloud sun rain
					icon_weather = "fa-cloud-sun-rain";
					$("#weather_desc").html("Light rain");
				}
				else if( clouds >= 80 && rain > 0.1 ){  //cloud  rain
					icon_weather = "fa-cloud-rain";
					$("#weather_desc").html("Light rain, overcast");
				}
				else if( clouds >= 80 && rain > 1 ){  //cloud  rain
					icon_weather = "fa-cloud-showers-heavy";
					$("#weather_desc").html("Shower rain");
				}
			}
			else{ //night
				if( clouds < 10 ){                    //moon
					icon_weather = "fa-moon";
					$("#weather_desc").html("Clear sky");
				}
				else if( clouds < 80 && rain < 0.1 ){ //clouds moon no rain
					icon_weather = "fa-cloud-moon";
					$("#weather_desc").html("Broken clouds");
				}
				else if( clouds >= 80 && rain < 0.1 ){ //clouds no rain
					icon_weather = "fa-cloud";
					$("#weather_desc").html("Overcast clouds");
				} 
				else if( clouds < 80 && rain > 0.1 ){  //cloud moon rain
					icon_weather = "fa-cloud-moon-rain";
					$("#weather_desc").html("Light rain");
				}
				else if( clouds >= 80 && rain > 0.1 ){  //cloud  rain
					icon_weather = "fa-cloud-rain";
					$("#weather_desc").html("Light rain, overcast");
				}
				else if( clouds >= 80 && rain > 1 ){  //cloud  rain
					icon_weather = "fa-cloud-moon-rain";
					$("#weather_desc").html("Shower rain");
				}
			}
			$("#icon-weather").removeClass().addClass("fas").addClass(icon_weather);
		    
			self.getDrawGaugeParamsFromIndex(index, self.knowledgeBase, false ).then( 
				([width, personalvalue, modelvalue, thermal, tip_html]) => {//
					console.log("update info draw gauge phase 2 " + [width, personalvalue, modelvalue, thermal, tip_html]);
					self.drawGauge( 'main_gauge', width, personalvalue, thermal );
					
					$("#tips").html( tip_html ); 
					$("#circle_gauge_color").css("color", getCurrentGaugeColor(personalvalue));
					$("#main_panel").fadeIn(500);
			});
		}
	},
	convertWeatherToChartData: function(){
		var data = {
			"labels":[],
			"wbgt":{ "points": []},
			"wbgt_max":{ "points": []},
			"ral":{ "points": []},
			"pal":{ "points": []},
			"ymax": 0,
		};
		for( var i=0; i<this.maxForecast; i++ ){
			var wbgt_min = this.knowledgeBase.thermalindices.phs[i].wbgt;
			var wbgt_effective_min = getWBGTeffective( wbgt_min, this.knowledgeBase );
			
			var item = {x: new Date( this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
						y: 1.0* wbgt_effective_min };
			
			data.labels.push( item.x );
			data.wbgt.points.push( item );
			
			var wbgt_max = this.knowledgeBase.thermalindices.phs[i].wbgt_max;
			var wbgt_effective_max = getWBGTeffective( wbgt_max, this.knowledgeBase );
			item = { x: new Date( this.knowledgeBase.thermalindices.phs[i].utc).toJSON(),
					 y: 1.0* wbgt_effective_max };
			data.wbgt_max.points.push( item );
			
			data.ymax = Math.max( data.ymax, 1.0* wbgt_effective_max );
		}
		return data;
	},
	drawChart: function( id, width, thermal ){
		var ctx = document.getElementById(id).getContext('2d');
		
		if( ctx.canvas.width !== width || ctx.canvas.height !== width){
			ctx.canvas.height = $(window).height()/2.5;
			ctx.canvas.width = 0.95*$(window).width();
		}
		
		/*
		var ral = RAL( this.knowledgeBase );
		var pal = ral + getPAL( this.knowledgeBase, thermal );
		*/
		var data = this.convertWeatherToChartData();	
		
		var x_from = data.labels[0];
		var x_to = data.labels[ data.labels.length-1 ];
		
		var ral = RAL( this.knowledgeBase );
		var pal = ral - getPAL( this.knowledgeBase, thermal );
		
		var green_y = 0.8*pal;
		var yellow_y = 1.0*pal;
		var orange_y = 1.2*pal;
		var red_y = Math.ceil( Math.max( 1.5*pal, data.ymax + 1) );
		console.log( [green_y, yellow_y, orange_y,red_y] );
		
		
		
		var chartData = {
			labels: data.labels,
			datasets: [{
				label: "wbgt",
				backgroundColor: 'rgba(255,255,255,0.3)',
				borderColor: 'rgba(255,255,255,1)',
				borderWidth: 2,
				fill: false,
				data: data.wbgt.points,
				cubicInterpolationMode:'monotone'
			},
			{
				label: "wbgt max",
				backgroundColor: 'rgba(255,255,255,0.7)',
				borderColor: 'rgba(255,255,255,1)',
				borderWidth: 2,
				fill: '-1',
				data: data.wbgt_max.points,
				cubicInterpolationMode:'monotone'
			},
			{
				label: "red",
				backgroundColor: 'rgba(180,0,0,.5)',
				borderColor: 'rgba(180,0,0,1)',
				borderWidth: 2,
				fill: "+1",
				data: [{x:x_from, y:red_y}, {x:x_to, y:red_y}],
				cubicInterpolationMode:'monotone',
				pointRadius: 0
			},
			{
				label: "orange",
				backgroundColor: 'rgba(255,125,0,.5)',
				borderColor: 'rgba(255,125,0,1)',
				borderWidth: 2,
				fill: "+1",
				data: [{x:x_from, y:orange_y}, {x:x_to, y:orange_y}],
				cubicInterpolationMode:'monotone',
				pointRadius: 0
			},
			{
				label: "yellow",
				backgroundColor: 'rgba(255,255,0,.5)',
				borderColor: 'rgba(255,255,0,1)',
				borderWidth: 2,
				fill: "+1",
				data: [{x:x_from, y:yellow_y}, {x:x_to, y:yellow_y}],
				cubicInterpolationMode:'monotone',
				pointRadius: 0
			},
			{
				label: "green",
				backgroundColor: 'rgba(0,255,0,.5)',
				borderColor: 'rgba(0,255,0,1)',
				borderWidth: 2,
				fill: "origin",
				data: [{x:x_from, y:green_y}, {x:x_to, y:green_y}],
				cubicInterpolationMode:'monotone',
				pointRadius: 0
			}
			]
		};
		new Chart(ctx, {
			type: 'line',
			data: chartData,
			options: {
				toolTips: {
					enabled: false
				},
				responsive: false,
				maintainAspectRatio: false,
				legend: false,
				scales: {
		            yAxes: [{
		                ticks: {
							fontSize: '16',
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato',
							max: red_y,
		                },
						gridLines:{
							color: 'rgba(255, 255, 255, 1)'
						},
						scaleLabel:{
							display: true,
							labelString: "WBGT effective (\u{2103})",
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato',
							fontSize: '16',
						}
		            }],
		            xAxes: [{
						type: 'time',
						distribution: 'linear',
						time: {
						},
		                ticks: {
							fontSize: '16',
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato',
							source: 'data'
		                },
						gridLines:{
							color: 'rgba(255, 255, 255, 1)'
						},
						scaleLabel:{
							display: false,
							labelString: "Time",
							fontColor: 'rgba(255, 255, 255, 1)',
							fontFamily: 'Lato'
						}
		            }],
					
				}
			}
		});	
		console.log("chart drawn");
	},
	drawGauge: function( id, width, value, key ){
		var c = $("#"+id), 
        	ctx = c[0].getContext('2d');
		
		if( ctx.canvas.width !== width || ctx.canvas.height !== width){
			ctx.canvas.height = width;
			ctx.canvas.width = width;
		}
		var title = value < 0 ? gaugeTitleCold( Math.abs(value)) : gaugeTitleHeat( Math.abs(value));
		var highlights =  this.knowledgeBase.gauge.highlights;
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
		    animationDuration: 3000,
			fontNumbersSize: 30,
			fontValueSize: 30,
		});
		gauge.draw();
	},
	scheduleDefaultNotification: function() {
		var ClimAppNotifications = getAllNotifications();
		if(ClimAppNotifications > 0) {
			cancelAllNotifications();
			console.log("All previous notifications cancelled.");
		} else {
			console.log("No previous notifications scheduled");
		}
	
		// Set notification time and date today @ 4.30PM
		var today = new Date();
		today.setDate(today.getDate());
		today.setHours(16);
		today.setMinutes(30);
		today.setSeconds(0);
		var today_at_4_30_pm = new Date(today);
	
		// Notification which is triggered 16.30 every weekday
		cordova.plugins.notification.local.schedule({
			id: 1,
			title: 'Feedback',
			text: 'How was your day?',
			icon: 'res://icon',
			smallIcon: 'res://icon-stencil',
			trigger: {
				type: "fix",
				at: today_at_4_30_pm.getTime()
		},
		actions: [
			{ id: 'feedback_yes', title: 'Open'},
			{ id: 'no',  title: 'Dismiss'}
		]
		});	
		console.log("Notification scheduled.");
	}
};

app.initialize();
