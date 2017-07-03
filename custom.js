// GoogleMaps function:
function initMap() {
  var uluru = {lat: 40.015, lng: -105.271};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru
  });
  var marker = new google.maps.Marker({
    position: uluru,
    map: map
  });
}
