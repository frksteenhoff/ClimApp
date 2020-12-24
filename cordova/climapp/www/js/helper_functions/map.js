function initMap(lat, lon, kb) {
   
    // Each marker is labeled with a single alphabetical character.
    var labels = 'BCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
	
	//window.map so map is available global scope
    window.map = new google.maps.Map(document.getElementById('map'), { 
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      	center: new google.maps.LatLng(lat, lon),
        zoom: 6
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
}