// GoogleMaps function:
function initMap() {
  var locations = [
     ['Title A', 40.025,-105.261, 1],
     ['Title B', 40.035,-105.251, 2],
     ['Title C', 40.045,-105.241, 3],
     ['Title D', 40.055,-105.231, 4]
  ];
  var uluru = {lat: 40.015, lng: -105.271};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru
  });
  var infowindow = new google.maps.InfoWindow;
  var marker, i;
  var geocoder = new google.maps.Geocoder();
  document.getElementById('submit').addEventListener('click', function() {
    geocodeAddress(geocoder, map);
  });
  var marker = new google.maps.Marker({
    position: uluru,
    map: map
  });
  for (i = 0; i < locations.length; i++) {  
    marker = new google.maps.Marker({
         position: new google.maps.LatLng(locations[i][1], locations[i][2]),
         map: map
    });

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
         return function() {
             infowindow.setContent(locations[i][0]);
             infowindow.open(map, marker);
         }
    })(marker, i));
  }
}
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
}
