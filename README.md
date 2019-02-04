# ClimApp - *climate information personalized* 

This is the codebase for the prototype and final app developed as a part of the ERA4CS ClimApp project. As the app is being developed the readme will be updated with necessary information.

Follow the app development (with some delay) in this interactive screen visualization: [https://invis.io/W3EQCCGSN](https://invis.io/W3EQCCGSN)

Note! Not all functionality is made available in the app, furthermore, the commits to the github prototype codebase will not be 1:1 with Invision App.

## Requirements and installation
For all Java code you need to install [Java](https://java.com/en/download/) and [Android Studio](https://developer.android.com/studio/install.html) including different SDKs/JDKs and JRE. 

For the best simulation of the app, use USB Debugging on your device (Developer mode).

Inspection of the scripts in Jupyter Notebooks require an installation of Python 2.7.


## App folder structure
**ClimApp**

Contains the Java code for the app

Structure of the program files:

``` 
   ./                                                           <-- Repository
    .idea/                                                                                                                             
    app/src/main/java/com/example/android/climapp/              <-- Source code
                                                  clothing/     <-- clothing fragment (currently not enabled in app) 
                                                  dashboard/    <-- dashboard fragment
                                                  data/         <-- database API + sqlite3 work
                                                  onboarding/   <-- onboarding fragment + onboarding activites
                                                  settings/     <-- settings fragment + settings activites
                                                  utils/        <-- helper classes
                                                  wbgt/         <-- wbgt classes
    build/
    gradle/wrapper/ 
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


Copyright frksteenhoff
