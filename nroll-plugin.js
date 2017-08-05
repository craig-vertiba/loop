/*
 * Here is the script that gets added to the body of the page calling this plugin:
    <script>
        (function() {
            var a = ''; // Study ID. Mandatory. From the "Study ID" field in the Study Detail record.
            var b = ''; // SurveyJS url. Optional. Will default to "https://surveyjs.azureedge.net/0.12.19/survey.jquery.js"
            var c = ''; // HTML content url. Required. No default. Plugin will fail without this file.
            var d = ''; // nRoll Plugin custom CSS url. Optional.
            var e = ''; // nRoll Plugin custom javascript. Optional.
            var f = ''; // Study website status. Options: 'preview', 'live'. Optional. Will default to 'live'.
            var params = '?a='+a+'&b='+b+'&c='+c+'&d='+d+'&e='+e+'&f='+f;
            var js = document.createElement('script'); js.type = 'application/javascript'; js.async = true;
            js.src = 'https://craig-vertiba.github.io/nroll/nroll-script.js' + params; js.id = 'nroll-plugin';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(js,s);
        }) ();
    </script>
 **/
/*
 * nRoll plugin Scripts
 * ---------------------------
 * Scripts here are responsible for loading and controlling the nRoll plugin
 * everything needs to be defined within this function to avoid potential conflicts with the host page.
 * It will be called automatically via the () at the end of the function.
 **/

(function() {
    var all_scripts = document.getElementsByTagName('script');
    var script_url;
    var scripts_counter;
    var utm_source;
    var utm_medium;
    var utm_campaign;
    var utm_term;
    var utm_content;
    var study_id; // ID of the study, from the "Study ID" in the Study Detail record
    var surveyjs_url = "https://surveyjs.azureedge.net/0.12.19/survey.jquery.js";  // SurveyJS source url parameter
    var html_content_url; // nRoll Plugin html content url parameter.  Required. No default.
    var customCSS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var customJS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var study_website_status = 'live'; // Study website status parameter.  Default is 'live'
//    var locations = '[{"name":"Mayo Clinic","lat":"33.5826","long":"-111.7923","order":"1"},{"name":"Cleveland Clinic","lat":"41.502910","long":"-81.620959","order":"2"},{"name":"Boulder Community Hospital","lat":"40.016672","long":"-105.236239","order":"3"},{"name":"Johns Hopkins", "lat":"39.298154","long":"-76.594253","order":"4"},{"name":"Tufts Medical Center","lat":"42.353467","long":"-71.062980","order":"4"}]';
    var locations = '[{"name":"Ronald Reagan UCLA Medical Center","lat":"34.066","long":"-118.446","id":"a0D6A000000wtOYUAY","street":"757 Westwood Plaza","city":"Los Angeles","state":"CA","country":"US","zip":"90095"},{"name":"Mayo Clinic","lat":"44.022","long":"-92.466","id":"a0D6A000000wtOTUAY","street":"200 1st St SW","city":"Rochester","state":"MN","country":"US","zip":"55905"},{"name":"Diabetes Research Institute","lat":"25.789","long":"-80.212","id":"a0D6A000000wtOdUAI","street":"1450 NW 10th Ave #R77","city":"Miami","state":"FL","country":"US","zip":"33136"}]';
    locations = JSON.parse(locations);
    var map_center; // these are the coordinates of the center of the Map when the map opens.  They are passed in with the intiializiation JSON.
    /*
     * Iterate through the loaded scripts looking for this one (must specify "nroll-script" on the id tag for this to work)
     * We need the script url to retrieve the parameters that were included in the url.
    **/

    for (var i=0; i < all_scripts.length; i++) {
        if (all_scripts[i].id == "nroll-script") {
            script_url = all_scripts[i].src;
        }
    }

    // Following parses the param string of script_url and assigns values to
    // study_id, surveyjs_url, html_content_url, customCSS_url, customJS_url and study_website_status.
    var hashes = script_url.slice(script_url.indexOf('?') + 1).split('&');
    for (var i=0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        switch (hash[0]) {
            case 'a':  
                study_id = hash[1];
                break;
            case 'b':
                // If a parameter value for SurveyJS URL is passed in, use it, otherwise leave it unchanged.
                if (hash[1] && hash[1] != "undefined" ) {
                    surveyjs_url = hash[1];
                }  
                break;
            case 'c':
                html_content_url = hash[1];
                break;
            case 'd':
                customCSS_url = hash[1];
                break;
            case 'e':
                customJS_url = hash[1];
                break;
            case 'f':
                study_website_status = hash[1];
                break;
        }
    }
    // Validate study_website_status.  Returns 'live' if the input is empty or invalid.
    study_website_status = ValidateStudyWebsiteStatus(study_website_status);

    // // following validates html_content_url.  Returns the input if valid or an empty string if not.
    // html_content_url = ValidateHTMLContentUrl(html_content_url);

    // // following validates customCSS_url.  Returns the input if valid or an empty string if not.
    // customCSS_url = ValidateCustomCSSUrl(customCSS_url);

    // // following validates customJS_url.  Returns the input if valid or an empty string if not.
    // customJS_url = ValidateCustomJSUrl(customJS_url);


    // Chain load the scripts here in the order listed below...
    // when the last script in the chain is loaded, main() will be called

    var scripts = [
        // Loads the most current version of jQuery.  If this plugin is to be used in third party websites
        // where older versions of jQuery are already loaded and are required, will need to modify this
        // to check for jQuery and use it if already loaded
        {"name": "jQuery", "src": "https://unpkg.com/jquery"},
        {"name": "SurveyJS", "src": surveyjs_url},
        {"name": "GoogleMaps", "src": "https://maps.googleapis.com/maps/api/js?key=AIzaSyDV9iKalrE9WbGJMceb9vKM9nmjYqZD0rc&libraries=geometry"}
    ];

    // If a custom js url is provided, add it to the scripts array
    if (customJS_url && customJS_url != "undefined" ) {
        scripts.push({"name": "Custom", "src": customJS_url});
    }


    // Set the scripts_counter to 0.  This is incremented as the scripts are loaded
    // and used to keep track of progress through the script list.

    scripts_counter = 0;

    //Start Loading Scripts

    CreateScriptTag(scripts[0].name, scripts[0].src);   

    /* ----------------------------------------------------------------------- 
     * CreateScriptTag
     * ----------------------------------------------------------------------- 
     * Creates a new script tag for insertion into the existing document
     * given the name (used for internal purposes) and the src for the script
     *************************************************************************/
    function CreateScriptTag(name, src) {

        var script_tag = document.createElement('script');

        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", src);
        script_tag.setAttribute("nroll-id", name);

        //script_tag.onload = ScriptLoadHandler;

        if (script_tag.readyState) {

            // Deal with IE 8 and lower browsers here (about 5% of browser mkt, when gets too low may want to remove to simplify)

            script_tag.onreadystatechange = function() {

                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    ScriptLoadHandler();
                }
            }

        } else {

            script_tag.onload = ScriptLoadHandler;
        }

        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }

    /* ----------------------------------------------------------------------- 
     * ScriptLoadHandler
     * ----------------------------------------------------------------------- 
     * This is a generic script tag onload handler that will load the 
     * next script in the chain if there are more scripts to load or
     * (if not) call the main function for execution of the main part of this
     * script. 
     *************************************************************************/
    function ScriptLoadHandler(params) {

        var scr = scripts[scripts_counter];

        // Advance the scripts_counter

        scripts_counter++;

        // Load the next script in the chain

        scr = scripts[scripts_counter];

        // If there is a next script to load, create the script tag, otherwise
        // call the PreMain() function.

        if (scr) {

            CreateScriptTag(scr.name, scr.src)
        
        } else {

            // This is the last script in the page, call PreMain()
            PreMain();
        }
    }

    /* ----------------------------------------------------------------------- 
     * PreMain()
     * ----------------------------------------------------------------------- 
     * This function contains all the remaining script that can be executed
     * without jQuery.  Once we get into script that requires jQuery we
     * have to enter main(), which is called at the end of this script.
     *************************************************************************/
    function PreMain() {
        // Dynamically load the pre-requisite and local stylesheets

        AddStylesheet('bootstrap', "https://unpkg.com/bootstrap@3.3.7/dist/css/bootstrap.min.css");

        // If a custom css url is provided, add it
        if (customCSS_url && customCSS_url != "undefined" ) {
            AddStylesheet('custom', customCSS_url);
        }

        // Parse the param string of url of the page that called this script looking for UTM parameters.
        // If found, assign them to the utm parameter variables.
        if (window.location.href.indexOf('?') >= 0) {
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i=0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                switch (hash[0]) {
                    case 'utm_source':  
                        utm_source = hash[1];
                        break;
                    case 'utm_content':
                        utm_content = hash[1];
                        break;
                    case 'utm_term':
                        utm_term = hash[1];
                        break;
                    case 'utm_campaign':
                        utm_campaign = hash[1];
                        break;
                    case 'utm_medium':
                        utm_medium = hash[1];
                        break;
                }
            }
        }
        
        main();  
    }

    /* ---------------------------------------------------------------------------------
     * ValidateParam1(position)
     * ---------------------------------------------------------------------------------
     * This function is called to validate a widget position input.  If the position
     * input is valid, it is returned, otherwise null is returned.
     * --------------------------------------------------------------------------------- */
    // function ValidateParam1(position) {

    //     var widget_position_valid = false;
    //     var arr = [ "top-left","top-center","top-right","left-center","center","right-center","bottom-left","bottom-center","bottom-right"];

    //     for (var i = 0; i < arr.length; i++) {
    //         if (arr[i] == position) {
    //             widget_position_valid = true;
    //         }
    //     }

    //     if (!widget_position_valid) {
    //         position = "";
    //     }
    //     return position;
    // }

    /* ---------------------------------------------------------------------------------
     * Validatehtml_content_url(target)
     * ---------------------------------------------------------------------------------
     * This function is called to validate a widget url target input.  If the target
     * input is valid, it is returned, otherwise null is returned.  At the moment, the
     * only valid inputs are "local" and "default", but at some point we may allow 
     * specific urls to be passed in, in which case we'll have to test for a valid url
     * pattern here.
     * --------------------------------------------------------------------------------- */
    // function Validatehtml_content_url(target) {

    //     var widget_target_valid = false;
    //     var arr = [ "local", "default" ];

    //     for (var i = 0; i < arr.length; i++) {
    //         if (arr[i] == target) {
    //             widget_target_valid = true;
    //         }
    //     }

    //     if (!widget_target_valid) {
    //         target = "";
    //     }
    //     return target;
    // }

    /* ---------------------------------------------------------------------------------
     * ValidateStudyWebsiteStatus(param)
     * ---------------------------------------------------------------------------------
     * This function is called to validate the study_website_status parameter.  If the
     * current value of the variable is equal to an allowed value, it will not be changed.
     * If it is blank or invalid, it will be changed to 'live'
     * --------------------------------------------------------------------------------- */
    function ValidateStudyWebsiteStatus(param) {

        var param_valid = false;
        var arr = [ "preview", "live" ];

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == param) {
                param_valid = true;
            }
        }

        if (!param_valid) {
            param = "live";
        }
        return param;
    }

    /* --------------------------------------------------------------------------------------------------------
     * main()
     * --------------------------------------------------------------------------------------------------------
     * This is the main function that will perform most of the functionality of the nroll plugin.
     * It will *only* be called after the necessary scripts have been loaded in the prescribed order in the
     * main anonymous function. It is called by the PreMain script which is called by the load handler 
     * after the last script is loaded
     * -------------------------------------------------------------------------------------------------------- */
    function main() {

        /* --------------------------------------------------------------------------------------------------------
         * jQuery(document).ready(function($)
         * --------------------------------------------------------------------------------------------------------
         * This is the equivalent of the typical $(document).ready(function() {}) call that is called when 
         * jQuery indicates that the page is 'ready'. Put all code that requires jQuery in here!
         * -------------------------------------------------------------------------------------------------------- */
        jQuery(document).ready(function($) {

            // This is the id value of the div to which the entire plugin will be appended.
            var div = $("#nroll-plugin");
            div.load(html_content_url, function() {
                // check to see if the appId cookie is set and if it is get the appId
                // make plugin initiation call to API and include appId if available
                // get all survey JSON
                // get answer data if available
                // show eligibility survey
                // need to remember users location (zip/postal code/address)? probably not
                // display map centered on selected site with all other sites hidden
                // show site info at top of left panel and details survey below
                // should have a "search again" button below selected site data
                

                var eligibilityJSON = {completeText:"Submit",pages:[{elements:[{type:"checkbox",name:"Are you 18 years or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"age",navigationButtonsVisibility:"show"},{elements:[{type:"checkbox",name:"Are you recently diagnosed with mild-moderate asthma?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],innerIndent:2,name:"asthma",navigationButtonsVisibility:"show"},{elements:[{type:"checkbox",name:"Typically, do you use an inhaler more than twice daily?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"inhaler",navigationButtonsVisibility:"show"},{elements:[{type:"checkbox",name:"Do you undertake exercise more than three times per week?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"exercise",navigationButtonsVisibility:"show"},{elements:[{type:"checkbox",name:"Do you have a BMI of 35 or over?",title:"Do you have a BMI of 35 or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"bmi",navigationButtonsVisibility:"show"}],showCompletedPage:false,showPageTitles:false,showProgressBar:"top",showQuestionNumbers:"off",showTitle:false,title:"Title of the survey"};
                var siteFinderJSON = {pages:[{name:"page1",elements:[{type:"html",html:"<span style=\"font-size:20px\">Thank You</span></br></br>You may be eligible for this study.</br>Please search for your local study site",name:"zip message"}]}],showCompletedPage:false,showNavigationButtons:false,showPageTitles:false,showQuestionNumbers:"off",showTitle:false,storeOthersAsComment:false};
                // var detailsJSON = {pages:[{name:"page1",elements:[{type:"html",temp:"temp",html:"<div style=\"text-align:center;margin-bottom:20px\"><span style=\"font-size:20px\">Lastly, please leave your details</span></br></br>So that we can get in touch with you about the possibility of you taking part in the XXXXXXXXXX Study, please complete this form with your details.</div>",name:"question1"},{type:"text",name:"question2",placeHolder:"NAME*"},{type:"text",name:"question3",placeHolder:"PHONE*"},{type:"text",name:"question4",placeHolder:"EMAIL*",validators:[{type:"email"}]},{type:"radiogroup",choices:["Email","Phone"],colCount:2,name:"question6",title:"CONTACT PREFERENCE"},{type:"html",html:"<span style=\"font-size:10px;line-height:4\">*Mandatory</span>",name:"question5"}]}],showCompletedPage:false,showPageTitles:false,showQuestionNumbers:"off",showTitle:false};
                var detailsJSON = {"showPageNumbers":false,"showTitle":false,"showCompletedPage":false,"showNavigationButtons":true,"showProgressBar":"off","showQuestionNumbers":"off","showPageTitles":false,"title":"",completeText:"",pageNextText:"",pagePrevText:"","pages":[{"navigationButtonsVisibility":"show","title":"","elements":[{"type":"html","isRequired":true,"name":"Top HTML","startWithNewLine":true,"html":"<div style=\"text-align:center;margin-bottom:20px\"><span style=\"font-size:20px\">Lastly, please leave your details</span></br></br>So that we can get in touch with you about the possibility of you taking part in the XXXXXXXXXX Study, please complete this form with your details.</div>"},{"type":"text","isRequired":true,"name":"name","startWithNewLine":true,title:"Name",placeHolder:"NAME*",inputType:"text"},{"type":"text","isRequired":true,"name":"phone","startWithNewLine":true,title:"phone",placeHolder:"PHONE*",inputType:"text"},{"type":"text","isRequired":true,"name":"email","startWithNewLine":true,title:"email",placeHolder:"EMAIL*",inputType:"email",validators:[{type:"email",text:""}]},{"type":"radiogroup","isRequired":true,"name":"contact preference","startWithNewLine":true,title:"CONTACT PREFERENCE","colCount":2,"choices":["Email","Phone",]},{"type":"html","isRequired":true,"name":"mandatory","startWithNewLine":true,"html":"<span style=\"font-size:10px;line-height:4\">*Mandatory</span>"},]},]};
                var successJSON = {"showPageNumbers":false,"showTitle":false,"showCompletedPage":false,"showNavigationButtons":false,"showProgressBar":"off","showQuestionNumbers":"off","showPageTitles":false,"title":"",completeText:"",pageNextText:"",pagePrevText:"","pages":[{"navigationButtonsVisibility":"hide","title":"","elements":[{"type":"html","isRequired":true,"name":"success message","startWithNewLine":true,"html":"<div style=\"text-align:center;margin-bottom:20px\"><span style=\"font-size:20px\">Thank you</span></br></br>Many thanks for your interest in XXXXXXXXXX Study.</br>One of our study team will be in touch shortly.</div>"},]},]};
                var sitesJSON = {"sites":[{"name":"Ronald Reagan UCLA Medical Center","lat":"34.066","long":"-118.446","id":"a0D6A000000wtOYUAY","street":"757 Westwood Plaza","city":"Los Angeles","state":"CA","country":"US","zip":"90095"},{"name":"Mayo Clinic","lat":"44.022","long":"-92.466","id":"a0D6A000000wtOTUAY","street":"200 1st St SW","city":"Rochester","state":"MN","country":"US","zip":"55905"},{"name":"Diabetes Research Institute","lat":"25.789","long":"-80.212","id":"a0D6A000000wtOdUAI","street":"1450 NW 10th Ave #R77","city":"Miami","state":"FL","country":"US","zip":"33136"}]};
                // mapCenter = (get this from the initialization JSON);
                console.log(sitesJSON.sites[0].name);
                // sitesJSON = JSON.parse(sitesJSON);
                // for (var i = 0, len = sitesJSON.length; i < len; i++){
                //     console.log(sitesJSON[i][1],sitesJSON[i][2]);
                //     // img.setAttribute("src",obj[i][2] + obj[i][1]);
                //     // document.body.appendChild(img);
                // }
                // gettoken();
                var eligibilityData = {};   
                var detailsData = {};   
                Survey.Survey.cssType = "bootstrap";
                var eligibilitySurvey = new Survey.Model(eligibilityJSON);
                var siteFinderSurvey = new Survey.Model(siteFinderJSON);
                var detailsSurvey = new Survey.Model(detailsJSON);
                var successSurvey = new Survey.Model(successJSON);
                eligibilitySurvey.onComplete.add(function(result) {
                    // send results to API
                    // if callback failedsurvey = false, execute the following:
                    Hide( "#plugin-eligibility" ); //$("#plugin-eligibility").addClass("hide");
                    Show( "#plugin-map" ); //$("#plugin-map").removeClass("hide");
                    //$("#plugin-map").addClass("show");
                    //console.log(surveyJSON3.pages[0]['elements'][0]['temp']);
                    initMap();
                    // if callback failedsurvey= true, display the inelibible survey
                });
                detailsSurvey.onComplete.add(function(result) {
                     // document.querySelector('#detailsResult').innerHTML = "result: " + JSON.stringify(result.data);
                    Hide( "#details-container" ); // $("#details-container").removeClass("show");
                    // $("#details-container").addClass("hide");
                    Show( "#success-container" ); //$("#success-container").removeClass("hide");
                    // $("#success-container").addClass("show");
                });
                $("#eligibility").Survey({
                    model: eligibilitySurvey,
                    data: eligibilityData
                });
                $("#site-finder").Survey({
                    model: siteFinderSurvey
                });
                $("#details").Survey({
                    model: detailsSurvey,
                    data: detailsData
                });
                $("#success").Survey({
                    model: successSurvey
                });
                $(document).on('click', '#continue', function() {
                    Hide( "#site-finder-container" ); // $("#site-finder-container").addClass("hide");
                    Show( "#details-container" ); // $("#details-container").removeClass("hide");
                    // $("#details-container").addClass("show");
                });

            });

            function Show(element) {
                if ($(element).hasClass("hide")) {
                    $(element).removeClass("hide");
                }
                $(element).addClass("show");
            };

            function Hide(element) {
                if ($(element).hasClass("show")) {
                    $(element).removeClass("show");
                }
                $(element).addClass("hide");
            };

            // function gettoken()
            // {
            //     console.log("in gettoken");
            //     var param = {
            //       grant_type: "password",
            //       client_id : "3MVG9sLbBxQYwWqszWUi_utes8J._m1TRh2ytppkiWGjl9V45LNsP6lrO8fBh9vp2PeZqjRLOvvd9.AhHKq8P",
            //       client_secret : "1498148715654130436",
            //       username:"nroll.sysadmin@langlandorg.com.dev2",
            //       password:"nrollsysadmin2ITTYudvIeDt4TBiC5BF9epGh"};
            // $.ajax({
            //     url: 'https://cs14.salesforce.com/services/oauth2/token',
            //     type: 'POST',
            //     data: param,
            //     dataType: "json",
            //     contentType: "application/x-www-form-urlencoded",
            //     success: function (data) {
            //         alert(data);
            //     },
            //     error: function(xhr,err){
            //         alert("readyState: "+xhr.readyState+"\nstatus: "+xhr.status);
            //         alert("responseText: "+xhr.responseText);
            //     }

            // });
            // }

        }); // end jquery.documentready

        /*** NOTE - ANY FUNCTIONS DEFINED OUT HERE WILL NOT HAVE ACCESS TO JQUERY PROPERLY DUE TO jQuery.noConflict(true) ***/

    } // end main()

    /* ---------------------------------------------------------------------------------
     * AddStylesheet(id, href)
     * ---------------------------------------------------------------------------------
     * Adds a stylesheet <link> element to the current page with the specified
     * id and href
     *
     * @id   = id attribute to use on the generated link tag
     * @href = href (source of css file) to use for generated link tag
     * --------------------------------------------------------------------------------- */
    function AddStylesheet(id, href) {

        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.id = id;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.media = 'all';
        
        head.appendChild(link);
    }

    function GetCookie(check_name) {
      
      // first we'll split this cookie up into name/value pairs
      // note: document.cookie only returns name=value, not the other components
      var a_all_cookies = document.cookie.split( ';' );
      var a_temp_cookie = '';
      var cookie_name = '';
      var cookie_value = '';
      var b_cookie_found = false; // set boolean t/f default f

      for ( i = 0; i < a_all_cookies.length; i++ )
      {
        // now we'll split apart each name=value pair
        a_temp_cookie = a_all_cookies[i].split( '=' );

        // and trim left/right whitespace while we're at it
        cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

        // if the extracted name matches passed check_name
        if ( cookie_name == check_name )
        {
          b_cookie_found = true;
          // we need to handle case where cookie has no value but exists (no = sign, that is):
          if ( a_temp_cookie.length > 1 )
          {
            cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
          }
          // note that in cases where cookie is initialized but no value, null is returned
          return cookie_value;
          break;
        }
        a_temp_cookie = null;
        cookie_name = '';
      }
      if ( !b_cookie_found )
      {
        return null;
      }
    }

    function SetCookie(name, value, expires, path, domain, secure )
    {
      // set time, it's in milliseconds
      var today = new Date();

      today.setTime(today.getTime());

      /* expires in 'expires' minutes */
      if (expires) {
        expires = expires * 1000 * 60;
      }
      
      var expires_date = new Date(today.getTime() + (expires));

      document.cookie = name + "=" + escape(value) +
      ((expires) ? ";expires=" + expires_date.toGMTString() : "") +
      ((path) ? ";path=" + path : "") +
      ((domain) ? ";domain=" + domain : "") +
      ((secure) ? ";secure" : "");
    }

    // this deletes the cookie when called
    function DeleteCookie( name, path, domain ) {
      if ( Get_Cookie( name ) ) document.cookie = name + "=" +
      ( ( path ) ? ";path=" + path : "") +
      ( ( domain ) ? ";domain=" + domain : "" ) +
      ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
    }

    var lastmarker;
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
    var marker;
    // GoogleMaps function:
    function initMap() {
      var uluru = {lat: 40.015, lng: -105.271}; // replace with mapCenter
      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru // replace with mapCenter
      });
      var infowindow = new google.maps.InfoWindow;
      // var marker, i;
      var i;
      var geocoder = new google.maps.Geocoder();
      document.getElementById('submit').addEventListener('click', function() {
        geocodeAddress(geocoder, map);
      });
      // var marker = new google.maps.Marker({
      //   position: uluru,
      //   map: map
      // });
      for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
             position: new google.maps.LatLng(locations[i].lat, locations[i].long),
             map: map
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
             return function() {
                 infowindow.setContent(locations[i].name);
                 infowindow.open(map, marker);
             }
        })(marker, i));
      }
    }
    function geocodeAddress(geocoder, resultsMap) {
        var address = document.getElementById('address').value;
        geocoder.geocode({'address': address}, function(results, status) {
            if (status === 'OK') {
                var infowindow = new google.maps.InfoWindow;

                // setMapOnAll(null);

                // if (lastmarker) {
                //     lastmarker.setMap(null);
                // }
                // var filtered_array = results[0].address_components.filter(function(address_component){
                //     return address_component.types.includes("country");
                // }); 
                // var country_long = filtered_array.length ? filtered_array[0].long_name: "";
                // var country_short = filtered_array.length ? filtered_array[0].short_name: "";
                // console.log("country_long: ",country_long);
                // console.log("country_short: ",country_short);
                resultsMap.setCenter(results[0].geometry.location);
                for (i = 0; i < locations.length; i++) {
                    var this_location = new google.maps.LatLng(locations[i].lat, locations[i].long);
                    locations[i].distance = google.maps.geometry.spherical.computeDistanceBetween(results[0].geometry.location, this_location);  
                    console.log(locations[i].name,locations[i].lat,locations[i].long,locations[i].order,locations[i].distance);
                }
                locations.sort(function(a, b){return a.distance-b.distance});
                var d1 = document.getElementById('sites-list');
                d1.innerHTML="";
                for (i = 0; i < locations.length; i++) {
                    locations[i].order = i;
                    d1.insertAdjacentHTML('beforeend', '<hr/><div><div style="width:20%;float:left;min-height:1px"></div><div style="width:60%;display:inline-block;text-align:left">'+locations[i].name+'<br/>'+locations[i].street+'<br/>'+locations[i].city+'<br/>'+locations[i].state+', '+locations[i].zip+'</div><div style="width:20%;display:inline-block;min-height:1px;text-align:bottom-right"><button id="'+locations[i].order+'">Select</button></div></div>');
                    console.log(locations[i].name,locations[i].lat,locations[i].long,locations[i].order,locations[i].distance);
                }
                for (i = 0; i < marker.length; i++) {
                    marker[i].setMap(null);
                }
                markers = [];
                var a;
                for (i = 0; i < locations.length; i++) {
                    a = locations[i] + 1;
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(locations[i].lat, locations[i].long),
                        label: a.toString(),
                        map: resultsMap
                    });
                    google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                            infowindow.setContent(locations[i].name);
                            infowindow.open(resultsMap, marker);
                        }
                    })(marker, i));
                }

                lastmarker = new google.maps.Marker({
                    map: resultsMap,
                    position: results[0].geometry.location
                });

            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }


})(); // immediately call our anonymous function here...
