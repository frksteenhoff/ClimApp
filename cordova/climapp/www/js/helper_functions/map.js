var map;
function initMap() {
    // Coordinates for Lyngby, Denmark
    var currentCoordinates = {lat: 37.422, lng: -122.084};

    map = new google.maps.Map(document.getElementById('map'), {
    center: currentCoordinates,
    zoom: 8
    });

    var marker = new google.maps.Marker({
        position: currentCoordinates,
        map: map,
        title: 'Current location'
      })

      // TODO: make possible to add searches of locations: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-geocoder
}