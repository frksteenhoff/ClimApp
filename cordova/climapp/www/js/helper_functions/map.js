var map;
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
    center: currentCoordinates,
    zoom: 8
    });

    var marker = new google.maps.Marker({
        position: currentCoordinates,
        map: map,
        title: 'Current location'
      })
}