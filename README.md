# ClimApp - *climate information personalized* 

This is the codebase for the prototype and final app developed as a part of the ERA4CS ClimApp project. As the app is being developed the readme will be updated with necessary information.

## Download ClimApp
ClimApp is now freely available in Google Play and App Store, download it here:

* Google Play: https://play.google.com/store/apps/details?id=com.climapp.app&hl=en
* App Store: https://apps.apple.com/us/app/climapp/id1458460604


<img src="https://github.com/frksteenhoff/ClimApp/blob/master/Conceptual%20drawings/screens/Screenshot_20190630-194041.jpg" alt="drawing" width="250"/>  <img src="https://github.com/frksteenhoff/ClimApp/blob/master/Conceptual%20drawings/screens/Screenshot_20190630-193853.jpg" alt="drawing" width="250"/>  <img src="https://github.com/frksteenhoff/ClimApp/blob/master/Conceptual%20drawings/screens/Screenshot_20190630-193931.jpg" alt="drawing" width="250"/>  

## Requirements and installation
### Android Studio project (in folder `ClimApp`)
For all Java code you need to install [Java](https://java.com/en/download/) and [Android Studio](https://developer.android.com/studio/install.html) including different SDKs/JDKs and JRE. 

For the best simulation of the app, use USB Debugging on your device (Developer mode).

Inspection of the scripts in Jupyter Notebooks require an installation of Python 2.7.

### Cordova project (in folder `cordova/climapp`)
* `node`
* `cordova`

Plugins
* `cordova-android ^7.1.4`
* `cordova-ios ^4.5.5`
* `cordova-plugin-badge ^0.8.8`
* `cordova-plugin-device ^2.0.2`
* `cordova-plugin-geolocation ^4.0.1`
* `cordova-plugin-local-notification ^0.9.0-beta.2`
* `cordova-plugin-splashscreen ^5.0.2`
* `cordova-plugin-statusbar ^2.4.2`
* `cordova-plugin-whitelist ^1.3.3`
* `cordova-plugin-x-toast ^2.7.2`
* `cordova-wheel-selector-plugin ^1.1.2`
* `tocca ^2.0.4` 

## Structure of the program files:

``` 
 cordova/climapp
 ├── hooks    
 ├── plugins                                                      <-- installed plugins
 ├── res                                                          <-- assets
 ├── www                                                          <-- source code
      ├── css/                                                    <-- styling
      ├── data/                                                   <-- additional data
      ├── img/                                                    <-- assets
      ├── js/                                                     <-- javascript files
      |     ├── helper_functions/                                 <-- logic used in different pages in app
      │     ├── thresholds/ 
      │     ├── phs/
      │     ├── test/
      │     │     ├── functionality/                              <-- unit tests (jest)
      │     │     ├── ui_tests/                                   <-- ui/integration tests (mocha, chai, jasmine) 
      │     ├── index.js                                          <-- main app content -- where app runs from
      │     ├── *.js                                              <-- logic and functionality files
      │     └── ..
      ├── pages/
      │     ├── *.html                                            <-- app screens
      │     └── ..
      ├── translations/                                           <-- translation spreadsheets and JSON object 
      ├── video/                                                  <-- video backgrounds
      ├── webfonts/                                               <-- fonts
      └── .. 
 ├── (platforms)                                                  <-- build versions (ignored)
 ├── (node_modules)                                               <-- modules (ignores)
 ..
 ClimApp                                                          <-- Android Repository (old)
 ├── ..
 ├── .idea/                                                                                                                             
 ├── app/release/                                                 <-- Application package (.apk) for Google Play
 ├── app/src/                                                     <-- source code
 │        ├── main/
 │        │     ├── res/
 │        │     │     ├── drawable                                <-- assets
 │        │     │     ├── font                                    <-- font
 │        │     │     ├── mipmap                                  <-- images
 │        │     │     ├── layout                                  <-- xml layout files
 │        │     │     ├── values                                  <-- globally accessible settings
 │        │     │     ├── xml                                     <-- network configuration 
 │        │     │     └── ..                                       
 │        │     └── java/com/example/android/climapp/             <-- fragments and activities  
 │        │                                     ├──   clothing/   <-- clothing fragment (currently not enabled in app) 
 │        │                                     ├──   dashboard/  <-- dashboard fragment
 │        │                                     ├──   data/       <-- database API + sqlite3 classes
 │        │                                     ├──   onboarding/ <-- onboarding fragment + onboarding activites
 │        │                                     ├──   settings/   <-- settings fragment + settings activites
 │        │                                     ├──   utils/      <-- helper classes
 │        │                                     └──   wbgt/       <-- wbgt classes
 │        ├──  test/java/com/android/climapp                      <-- test classes for critical parts of application
 │        └── ...
 ├── build/
 ├── gradle/wrapper/
 └── ...
 ```

### Other folders
**img**
* All images used in the ClimApp wiki 
* Images that shows the progression of the app UI

**OpenWeatherData**
 * Overview of available datasets and frequencies.
 * Check this website to get an overview of the data that can be delivered: [API information](http://openweathermap.org/price#weather)

Tests for fetching data from DWD Open Data and Open Weather Map in Jupyter Notebooks.

**Conceputal drawings**
* Overview of the architecture of the app (work in progress)

**Misc**
* Other files used by Henriette in the development phase.


## Documentation
Documentation of the app can be found in the [ClimApp Wiki](https://github.com/frksteenhoff/ClimApp/wiki). 


Copyright @frksteenhoff
