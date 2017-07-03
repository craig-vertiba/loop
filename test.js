 <body>
   <script>
    (function() {
      var param1 = 'param1_value';
      var param2 = 'param2_value';
      var param3 = 'param3_value';
      var param4 = 'param4_value';
      var params = '?param1=' + param1 + '&param2=' + param2 + '&param3=' + param3 + '&param4=' + param4;
      var js = document.createElement('script'); js.type = 'application/javascript'; js.async = true;
      js.src = 'https://craig-vertiba.github.io/nroll/nroll-script.js' + params; js.id = 'nroll-script';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(js,s);
    }) ();
  </script>
  <!-- End load nroll-script -->
  <div id="nroll-plugin">
  </div>
</body>
