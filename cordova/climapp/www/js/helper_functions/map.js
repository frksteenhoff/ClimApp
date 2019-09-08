function initMap() {
    // Coordinates for Copenhagen, Denmark
    var currentCoordinates = {lat: 55.676098, lng: 12.568337 };

    // Each marker is labeled with a single alphabetical character.
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;

    var map;
    let options = {timeout: 30000 };
    navigator.geolocation.getCurrentPosition( 
        function( position ){ //on success
            currentCoordinates = {lat: position.coords.latitude, lng: position.coords.longitude};	
            var elem = document.createElement("p");
            var text = document.createTextNode(location);
            elem.appendChild(text);
            document.getElementById("location_footer").appendChild(elem);
        }, 
        function( error ){ //on error
            showShortToast("Could not retrieve location for Google Maps.");
            console.log( error );
        },
        options // here the timeout is introduced
        );
        
    map = new google.maps.Map(document.getElementById('map'), {
        center: currentCoordinates,
        zoom: 8
    });
    
    // This event listener calls addMarker() when the map is clicked.
    google.maps.event.addListener(map, 'click', function(event) {
        addMarker(event.latLng, map);
    });

    // Add a marker at the center of the map.
    addMarker(currentCoordinates, map);
    
    // Adds a marker to the map.
    function addMarker(location, map) {
        // Add the marker at the clicked location, and add the next-available label
        // from the array of alphabetical characters.
        var marker = new google.maps.Marker({
        position: location,
        label: labels[labelIndex++ % labels.length],
        map: map
        });
        
        var elem = document.createElement("p");
        var text = document.createTextNode(location);
        elem.appendChild(text);
        document.getElementById("location_footer").appendChild(elem);
        console.log("locatttttttion: " + "  " +    document.getElementById("location_footer") + Object.keys(location));
    }
    
    /* request for geocoder is denied (will require billing)
    var geocoder = new google.maps.Geocoder();

    document.getElementById('submit').addEventListener('click', function() {
      geocodeAddress(geocoder, map);
    });

    function geocodeAddress(geocoder, resultsMap) {
        var address = document.getElementById('address').value;
        geocoder.geocode({'address': address}, function(results, status) {
          if (status === 'OK') {
            resultsMap.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
              map: resultsMap,
              position: results[0].geometry.location
            });
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });
    }*/

    google.maps.event.addDomListener(window, 'load', initMap);
}