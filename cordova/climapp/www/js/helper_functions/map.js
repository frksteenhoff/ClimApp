function initMap(lat, lon, kb) {
   
    var currentCoordinates = { lat: lat, lng: lon };

    // Each marker is labeled with a single alphabetical character.
    var labels = 'BCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
	
	//window.map so map is available global scope
    window.map = new google.maps.Map(document.getElementById('map'), { 
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      	center: new google.maps.LatLng(lat, lon),
        zoom: 8
    });
	
	var point = new google.maps.LatLng(lat, lon);
    var marker = new google.maps.Marker({
        position: point,
        label: "",
        map: window.map
    });

    // This event listener calls addMarker() when the map is clicked.
    google.maps.event.addListener(map, 'click', function (event) {
        addMarker(event.latLng, map);
    });

    // Add a marker at the center of the map.
    //addMarker(currentCoordinates, map);

    // Adds a marker to the map.
    function addMarker(location, map) {
        // Add the marker at the clicked location, and add the next-available label
        // from the array of alphabetical characters.
        var marker = new google.maps.Marker({
            position: location,
            label: labels[labelIndex++ % labels.length],
            map: map
        });
		kb.user.settings.coordinates_lat = marker.getPosition().lat();
		kb.user.settings.coordinates_lon = marker.getPosition().lng();
		$( "#marker_lat" ).html( kb.user.settings.coordinates_lat.toFixed(2) );
		$( "#marker_lon" ).html( kb.user.settings.coordinates_lon.toFixed(2) );
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

    //google.maps.event.addDomListener(window, 'load', initMap);
}