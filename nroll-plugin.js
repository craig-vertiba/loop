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
    var language_code = "en"; // default is English.  Must be lowercase to access SurveyJS localizations.
    var country_code = "US"; // passed in from Study website url. Default to US if blank.
    var region_code = "US"; // used in Google Maps Geocoding to limit scope of search results. Default to US.
    var study_id; // ID of the study, from the "Study ID" in the Study Detail record
    var surveyjs_url = "https://surveyjs.azureedge.net/0.12.20/survey.jquery.js";  // SurveyJS source url parameter
    var html_content_url; // nRoll Plugin html content url parameter.  Required. No default.
    var customCSS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var customJS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var study_website_status = 'live'; // Study website status parameter.  Default is 'live'
    // the following variables are used to display sites on the map:
    var locations; // json of sites
    var lastmarker; // user's location marker
    // var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Alpha marker labels
    // var labelIndex = 0; // used with Alpha marker labels
    var markers = []; // array of all site markers
    var bounds; // boundary coordinates to enclose all site markers
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
                case 'language':
                    language_code = hash[1].toLowerCase();
                    break;
                case 'country':
                    country_code = hash[1].toUpperCase();
                    break;
            }
        }
    }

    // set region code = country code except when country code is "uk"
    if (country_code == "UK") {
        region_code = "GB";
    } else {
        region_code = country_code;
    }

    // Validate study_website_status.  Returns 'live' if the input is empty or invalid.
    study_website_status = ValidateStudyWebsiteStatus(study_website_status);

    // Dynamically load stylesheets

    AddStylesheet('bootstrap', "https://unpkg.com/bootstrap@3.3.7/dist/css/bootstrap.min.css");

    // If a custom css url is provided, add it
    if (customCSS_url && customCSS_url != "undefined" ) {
        AddStylesheet('custom', customCSS_url);
    }

    // Chain load the scripts here in the order listed below...
    // when the last script in the chain is loaded, main() will be called

    var scripts = [
        // Loads the most current version of jQuery.  If this plugin is to be used in third party websites
        // where older versions of jQuery are already loaded and are required, will need to modify this
        // to check for jQuery and use it if already loaded
        {"name": "jQuery", "src": "https://unpkg.com/jquery"},
        // Loads FontAwesome.  The id number in the url below is linked to craig.mcsavaney@vertiba.com.
        // To get a new embed code linked to a different email address, go to fontawesome.io/get-started/,
        // get a new embed code, and update the url with the new one below.
        {"name": "FontAwesome", "src": "https://use.fontawesome.com/7bbc654582.js"},
        {"name": "SurveyJS", "src": surveyjs_url}
    ];

    // If the Study country is China or Taiwan, load Google Maps API from the china-specific URL, otherwise load from the standard URL
    if (country_code == "CN") {
        scripts.push({"name": "GoogleMaps", "src": "https://maps.google.cn/maps/api/js?key=AIzaSyDV9iKalrE9WbGJMceb9vKM9nmjYqZD0rc&libraries=geometry&language=zh-CN"});
    } else if (country_code == "TW") {
        scripts.push({"name": "GoogleMaps", "src": "https://maps.google.cn/maps/api/js?key=AIzaSyDV9iKalrE9WbGJMceb9vKM9nmjYqZD0rc&libraries=geometry&language=zh-TW"});
    } else {
        scripts.push({"name": "GoogleMaps", "src": "https://maps.googleapis.com/maps/api/js?key=AIzaSyDV9iKalrE9WbGJMceb9vKM9nmjYqZD0rc&libraries=geometry&language="+language_code});
    }

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

            // This is the last script in the page, call main()
            main();
        }
    }

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
     * main anonymous function. It is called by the script load handler function after the last script is loaded
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

            // Load the html content from the html content file (typically content.html) into the selected page element
//            div.load(html_content_url, function() {
            $.when( $.ajax(html_content_url)).done(function(a){
                div.append(a);
                // check to see if the appId cookie is set and if it is get the appId
                // make plugin initiation call to API and include appId if available
                // get all survey JSON
                // get answer data if available
                // show eligibility survey
                // need to remember users location (zip/postal code/address)? probably not
                // display map centered on selected site with all other sites hidden
                // show site info at top of left panel and details survey below
                // should have a "search again" button below selected site data
                

                var eligibilityJSON = {completeText:"Submit",pages:[{elements:[{type:"radiogroup",name:"Are you 18 years or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"age",navigationButtonsVisibility:"show"},{elements:[{type:"radiogroup",name:"Are you recently diagnosed with mild-moderate asthma?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],innerIndent:2,name:"asthma",navigationButtonsVisibility:"show"},{elements:[{type:"radiogroup",name:"Typically, do you use an inhaler more than twice daily?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"inhaler",navigationButtonsVisibility:"show"},{elements:[{type:"radiogroup",name:"Do you undertake exercise more than three times per week?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"exercise",navigationButtonsVisibility:"show"},{elements:[{type:"radiogroup",name:"Do you have a BMI of 35 or over?",title:"Do you have a BMI of 35 or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],name:"bmi",navigationButtonsVisibility:"show"}],showCompletedPage:false,showPageTitles:false,showProgressBar:"top",showQuestionNumbers:"off",showTitle:false,title:"Title of the survey"};
                var detailsJSON = {"showPageNumbers":false,"showTitle":false,"showCompletedPage":false,"showNavigationButtons":true,"showProgressBar":"off","showQuestionNumbers":"off","showPageTitles":false,"title":"",completeText:"",pageNextText:"",pagePrevText:"","pages":[{"navigationButtonsVisibility":"show","title":"","elements":[{"type":"html","isRequired":true,"name":"Top HTML","startWithNewLine":true,"visibleIf":"","html":"<div style=\"text-align:center;margin-bottom:20px\"><span style=\"font-size:20px\">Lastly, please leave your details</span></br></br>So that we can get in touch with you about the possibility of you taking part in the XXXXXXXXXX Study, please complete this form with your details.</div>"},{"type":"text","isRequired":true,"name":"name","startWithNewLine":true,"visibleIf":"",title:"Name",placeHolder:"NAME*",inputType:"text"},{"type":"text","isRequired":true,"name":"phone","startWithNewLine":true,"visibleIf":"",title:"Phone",placeHolder:"PHONE*",inputType:"text"},{"type":"text","isRequired":true,"name":"email","startWithNewLine":true,"visibleIf":"",title:"Email",placeHolder:"EMAIL*",inputType:"email",validators:[{type:"email",text:""}]},{"type":"radiogroup","isRequired":true,"name":"contact preference","startWithNewLine":true,"visibleIf":"",title:"CONTACT PREFERENCE","colCount":2,"choices":[{"value":"Email","text":"Email"},{"value":"Phone","text":"Phone"},]},{"type":"html","isRequired":true,"name":"blank space HTML","startWithNewLine":true,"visibleIf":"","html":"<br/>"},{"type":"checkbox","isRequired":true,"name":"terms","startWithNewLine":true,"visibleIf":"",title:"shouldn't be visible on this survey","colCount":1,"choices":[{"value":"I have read and agree to the terms of use*","text":"I have read and agree to the terms of use*"},]},{"type":"checkbox","isRequired":false,"name":"agent","startWithNewLine":true,"visibleIf":"",title:"shouldn't be visible on this survey","colCount":1,"choices":[{"value":"True","text":"I am submitting this information on behalf of the person shown above"},]},{"type":"html","isRequired":true,"name":"Agent HTML","startWithNewLine":true,"visibleIf":"{agent} = 'True'","html":"<br/><br/><div style=\"text-align:center;margin-bottom:20px\">As the authorized representative of the candidate shown above, please enter your contact information below.</div>"},{"type":"text","isRequired":true,"name":"agent name","startWithNewLine":true,"visibleIf":"{agent} = 'True'",title:"Agent Name",placeHolder:"YOUR NAME*",inputType:"text"},{"type":"text","isRequired":true,"name":"agent phone","startWithNewLine":true,"visibleIf":"{agent} = 'True'",title:"Agent Phone",placeHolder:"YOUR PHONE*",inputType:"text"},{"type":"text","isRequired":true,"name":"agent email","startWithNewLine":true,"visibleIf":"{agent} = 'True'",title:"Agent Email",placeHolder:"YOUR EMAIL*",inputType:"email",validators:[{type:"email",text:""}]},{"type":"html","isRequired":true,"name":"Mandatory HTML","startWithNewLine":true,"visibleIf":"","html":"<span style=\"font-size:10px;line-height:4\">*Mandatory</span>"},]},]};
                // mapCenter = (get this from the initialization JSON);
                locations = '[{"name":"Ronald Reagan UCLA Medical Center","lat":"34.066","long":"-118.446","id":"a0D6A000000wtOYUAY","street":"757 Westwood Plaza","city":"Los Angeles","state":"CA","country":"US","zip":"90095"},{"name":"Mayo Clinic","lat":"44.022","long":"-92.466","id":"a0D6A000000wtOTUAY","street":"200 1st St SW","city":"Rochester","state":"MN","country":"US","zip":"55905"},{"name":"Diabetes Research Institute","lat":"25.789","long":"-80.212","id":"a0D6A000000wtOdUAI","street":"1450 NW 10th Ave #R77","city":"Miami","state":"FL","country":"US","zip":"33136"}]';
                locations = JSON.parse(locations);

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
                // This is the eligibility survey.  Do not change the variable name from "survey" as localization only works
                // when there is a survey named this way.
                var survey = new Survey.Model(eligibilityJSON);
                // var siteFinderSurvey = new Survey.Model(siteFinderJSON);
                // var language_code = "de"; // this will come from the initialization string
                // sets the language for localization of survey messages.  Will apply to all surveys.
                if (language_code == "zh") {
                    survey.locale = "zh-cn";
                }
                else {
                    survey.locale = language_code;
                }
                

                // console.log(Survey.surveyLocalization.locales[language_code].pagePrevText);

                var detailsSurvey = new Survey.Model(detailsJSON);
                // var successSurvey = new Survey.Model(successJSON);
                survey.onComplete.add(function(result) {
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
                    model: survey,
                    data: eligibilityData
                });
                // $("#site-finder").Survey({
                //     model: siteFinderSurvey
                // });
                $("#details").Survey({
                    model: detailsSurvey,
                    data: detailsData
                });
                // $("#success").Survey({
                //     model: successSurvey
                // });
                // $(document).on('click', '#continue', function() {
                //     Hide( "#site-finder-container" ); // $("#site-finder-container").addClass("hide");
                //     Show( "#details-container" ); // $("#details-container").removeClass("hide");
                // });
                // $(document).on('click', '#submit', function() {
                //     Hide( "#site-finder" ); // $("#site-finder-container").addClass("hide");
                //     Show( "#your-nearest-study-center" );
                //     Show( "#sites-list");
                //     // the content of the site finder container is centered vertically by default.
                //     // if there are so many sites available that a vertical scroll bar will be visible,
                //     // remove the class that centers the content vertically so the content at the top
                //     // of the div will not be hidden
                //     if ($('#map-left-panel').hasScrollBar()) {
                //         $('#site-finder-container').removeClass("center-vertically");
                //     };
                // });
                // $(document).on('click', '.site-selector', function() {
                //     Hide( "#site-finder-container" ); // $("#site-finder-container").addClass("hide");
                //     Show( "#details-container" ); // $("#details-container").removeClass("hide");
                // });
                // $(document).on('click', '#change-location', function() {
                //     Show( "#site-finder-container" ); // $("#site-finder-container").addClass("hide");
                //     Hide( "#details-container" ); // $("#details-container").removeClass("hide");
                // });

            });

            $(document).on('click', '#submit', function() {
                Hide( "#site-finder" ); // $("#site-finder-container").addClass("hide");
                Show( "#your-nearest-study-center" );
                Show( "#sites-list");
                // the content of the site finder container is centered vertically by default.
                // if there are so many sites available that a vertical scroll bar will be visible,
                // remove the class that centers the content vertically so the content at the top
                // of the div will not be hidden
                if ($('#map-left-panel').hasScrollBar()) {
                    $('#site-finder-container').removeClass("center-vertically");
                };
            });
            $(document).on('click', '.site-selector', function() {
                Hide( "#site-finder-container" ); 
                Show( "#details-container" ); 
            });
            $(document).on('click', '#change-location', function() {
                Show( "#site-finder-container" ); 
                Hide( "#details-container" ); 
            });


            function initializePlugin() {

            };

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

            (function($) {
                $.fn.hasScrollBar = function() {
                    return this.get(0).scrollHeight > this.height();
                }
            })(jQuery);

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

    // GoogleMaps function:
    function initMap() {
        var uluru = {lat: 40.015, lng: -105.271}; // replace with mapCenter
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 4,
            center: uluru // replace with mapCenter
        });
        var infowindow = new google.maps.InfoWindow;
        var marker, i;
        // var i;
        var geocoder = new google.maps.Geocoder();
        document.getElementById('submit').addEventListener('click', function() {
            geocodeAddress(geocoder, map);
        });

        document.getElementById("address")
            .addEventListener("keyup", function(event) {
            event.preventDefault();
            if (event.keyCode == 13) {
                document.getElementById("submit").click();
            }
        });
        bounds = new google.maps.LatLngBounds();
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
            markers.push(marker);
            bounds.extend(marker.getPosition());
        }
        map.fitBounds(bounds);
        // build the sites list page element
        buildSitesList(map);
    }

    function buildSitesList(resultsMap) {
        // get the page element to which we need to add the list of sites
        var d1 = document.getElementById('sites-list');
        // delete any html already attached to that element (like a prior list of sites)
        d1.innerHTML="";
        // add new html to display the list of sites, and add event listeners to all the select buttons
        for (i = 0; i < locations.length; i++) {
            a = i + 1;
            d1.insertAdjacentHTML('beforeend', '<hr/><div><div style="width:20%;float:left;min-height:1px">'+a+'</div><div style="width:60%;display:inline-block;text-align:left">'+locations[i].name+'<br/>'+locations[i].street+'<br/>'+locations[i].city+'<br/>'+locations[i].state+', '+locations[i].zip+'</div><div style="width:20%;display:inline-block;min-height:1px;text-align:bottom-right"><button id="location-'+i+'" class="site-selector">Select</button></div></div>');
            document.getElementById('location-' + i).addEventListener('click', function() {
                siteSelected(resultsMap,this.id);
            });
        }
    }


    function changeSite(resultsMap) {
        // show all site markers
        for (j = 0; j < markers.length; j++) {
            if (j != i) {
                markers[j].setVisible(true);
            }
        }
        // show the user's current location marker
        if (lastmarker) {
            lastmarker.setVisible(true);
        }
        // reset the map to the bounds of the site markers
        resultsMap.fitBounds(bounds);
        // center the map on the user's current marker
        resultsMap.setCenter(lastmarker.position);
    }

    function siteSelected(resultsMap,clicked_id) {
        // clicked_id should always be in the format location-i.  Slice off 'i' and convert to a Number.
        var i = Number(clicked_id.slice(9));
        // add 1 so the marker numbers don't start at 0 like the marker array identifiers
        var a = i + 1;
        // get the page element to which we need to add the selected site
        var d1 = document.getElementById('selected-site');
        // delete any html already attached to that element (like a previously selected site)
        d1.innerHTML="";
        // add new html to display the selected site
        d1.insertAdjacentHTML('beforeend', '<div style="text-align:center"><div style="width:20%;float:left;min-height:1px">'+a+'</div><div id="selected-site-name" style="width:60%;display:inline-block">'+locations[i].name+'</div><div style="width:20%;display:inline-block;min-height:1px;text-align:bottom-right"><button id="change-location">Change</button></div></div><hr/>');
        // add an event listener to the change button
        document.getElementById('change-location').addEventListener('click', function() {
            changeSite(resultsMap);
        });
        // hide all the markers except the marker for the selected site
        for (j = 0; j < markers.length; j++) {
            if (j != i) {
                markers[j].setVisible(false);
            }
        }
        // hide the user's current location marker
        if (lastmarker) {
            lastmarker.setVisible(false);
        }
        // recenter the map on the selected site location
        resultsMap.setCenter(new google.maps.LatLng(locations[i].lat, locations[i].long));
        // reset the map zoom level
        resultsMap.setZoom(8);
    }

    function geocodeAddress(geocoder, resultsMap) {
        // get the value submitted by the user.  Should be a zip code but could be anything.
        var address = document.getElementById('address').value;
        // attempt to geocode the address information submitted by the user.
        geocoder.geocode({'address': address, componentRestrictions: {country: country_code}}, function(results, status) {
            if (status === 'OK') {
                var infowindow = new google.maps.InfoWindow;
                var a;
                // if it exists, remove the marker of the user's location from the map
                // this will be replaced by a new marker with the new location below
                if (lastmarker) {
                    lastmarker.setMap(null);
                }
                // var filtered_array = results[0].address_components.filter(function(address_component){
                //     return address_component.types.includes("country");
                // }); 
                // var country_long = filtered_array.length ? filtered_array[0].long_name: "";
                // var country_short = filtered_array.length ? filtered_array[0].short_name: "";
                // console.log("country_long: ",country_long);
                // console.log("country_short: ",country_short);

                // recenter the map on the user's new location
                resultsMap.setCenter(results[0].geometry.location);
                // iterate through the site locations and calculate the distance from each to the user's new location
                for (i = 0; i < locations.length; i++) {
                    var this_location = new google.maps.LatLng(locations[i].lat, locations[i].long);
                    locations[i].distance = google.maps.geometry.spherical.computeDistanceBetween(results[0].geometry.location, this_location);  
                }
                // sort the site locations in ascending order of distance from the user's new location
                locations.sort(function(a, b){return a.distance-b.distance});
                // build the sites list page element
                buildSitesList(resultsMap);
                // clear all existing site location markers from the map
                for (i = 0; i < markers.length; i++) {
                    markers[i].setMap(null);
                }
                // empty the marker array
                markers.length = 0;
                // loop through all the locations and create new markers numbered in ascending order based on the site's distance 
                // from the user's new location, then add an infowindow listener to each marker
                for (i = 0; i < locations.length; i++) {
                    a = i + 1;
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
                    // now add the new marker to the markers array
                    markers.push(marker);
                }
                // add a marker for the user's new location
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
