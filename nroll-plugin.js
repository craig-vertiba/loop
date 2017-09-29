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
    var utm_source = "";
    var utm_medium = "";
    var utm_campaign = "";
    var utm_term = "";
    var utm_content = "";
    var eligibilityData = {}; // holds the eligibility survey results data
    var detailsData = {}; // holds the details survey results data
    var application_id = ""; // salesforce id number of the current application
    var selected_site = ""; // salesforce id number of the selected site
    var language_code; // Extracted from Study website. Must be lowercase to access SurveyJS localizations.
    var country_code; // Extracted from Study website url.
    var region_code; // Used in Google Maps Geocoding to limit scope of search results.
    var study_id; // ID of the study, from the "Study ID" in the Study Detail record.  Passed in as nroll-plugin parameter.
    var langCountryCode; // language plus country code extracted from Study website url.
    var surveyjs_url = "https://surveyjs.azureedge.net/0.12.20/survey.jquery.js";  // SurveyJS source url parameter with default.
    var html_content_url; // nRoll Plugin html content url parameter.  Required. No default.
    var customCSS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var customJS_url; // nRoll Plugin custom javascript url parameter. No Default.
    var api_base_url = "https://cs14.force.com/services/apexrest/";
    var access_token = "00Dc0000003w6AY!ARcAQH1Sp8NKI5RG7zaAej8UMMOb.uS5MXLglj.ndF1z0SGusIeeq73sPBpwvKsWhV_gc5AOoXK9rXzzKyRxTVrvD7dY9xZG"; // 
    var create_or_update_calls = 0; // this is a counter that counts the number of times the eligibility create or update API has been called
    var create_or_update_responses = 0; // this is a counter that counts the number of times the eligibility create or update API has responded
    var tries = 0; // this is the number of times the while loop has compared create_or_update_calls to create_or_update_responses
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

    // extract the language code and country code from the Study website url
    // we are looking for a string in the url like "/en-us/"
    // we look for the first segment of the url that is five characters between two forward slashes
    // then we check to see if the third character is a dash and the remaining characters are numbers
    // if the string fits this pattern, we assume the first two characters are the language code
    // and the last two characters are the country code and assign them accordingly, then discontinue searching.
    var base_url = window.location.href;
    var base_url_segments = base_url.split('/');
    for ( i = 0; i < base_url_segments.length; i++ ) {
        if (base_url_segments[i].length == 5) {
            if (base_url_segments[i].indexOf('-') == 2 
                && base_url_segments[i].charAt(0).toLowerCase() != base_url_segments[i].charAt(0).toUpperCase()
                && base_url_segments[i].charAt(1).toLowerCase() != base_url_segments[i].charAt(1).toUpperCase()
                && base_url_segments[i].charAt(3).toLowerCase() != base_url_segments[i].charAt(3).toUpperCase()
                && base_url_segments[i].charAt(4).toLowerCase() != base_url_segments[i].charAt(4).toUpperCase()) {
                langCountryCode = base_url_segments[i].toLowerCase();
                language_code = base_url_segments[i].substring(0,2).toLowerCase();
                country_code = base_url_segments[i].substring(3).toUpperCase();
                break;
            }
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
                // case 'language':
                //     language_code = hash[1].toLowerCase();
                //     break;
                // case 'country':
                //     country_code = hash[1].toUpperCase();
                //     break;
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

            // // First, asynchronously load and append the HTML content to the Plugin element and get the Salesforce
            // // access token
            // $.when(loadHTMLContent(),getToken()).done(function(a,b) {
            //     // now that we have the token we can retrieve the data necessary to initialize the Plugin
            //     $.when(getPluginData()).done(function(a) {

            //     }
            // }
            // // load the HTML content to a content variable
            // function loadHTMLContent() {
            //     // ajax call, assign content to variable in callback
            // }
            // // get the Salesforce access token and assign to a variable
            // function getToken() {
            //     // ajax call, assign token to variable in callback
            // }
            // get the Application Plugin data necessary to initialize the Plugin
            function getPluginData() {
                return $.ajax({
                    type:'GET',
//                    url: api_base_url + "InitiatePlugin?studyId=" + study_id + "&langCountryCode=" + langCountryCode,
                    url: "https://guarded-tor-53502.herokuapp.com?api_type=initiate_plugin&studyId=" + study_id + "&langCountryCode=" + langCountryCode + "&method_type=GET",  // new
//                    headers:{'Authorization':'Bearer ' + access_token},
                    crossDomain: true, //new
                    dataType: 'json', //new
                    success: function(json) {
                        PluginData = json;
                    },
                    error: function(data, status, xhr) {
                    },
                    complete: function(jqXHR, textStatus) {
                    }
                });

            }

            // // create a new application
            // function CreateNewApplication() {
            //     var new_application_data = new Object();
            //     new_application_data.survey = PluginData.survey;
            //     new_application_data.studycountry = PluginData.studyCountry;
            //     new_application_data.application = "";
            //     new_application_data.type = "eligibility";
            //     new_application_data.utmsource = utm_source;
            //     new_application_data.utmcontent = utm_content;
            //     new_application_data.utmterm = utm_term;
            //     new_application_data.utmcampaign = utm_campaign;
            //     new_application_data.utmmedium = utm_medium;
            //     new_application_data.country = PluginData.country;
            //     new_application_data.language = PluginData.language;
            //     new_application_data.site = selected_site;
            //     new_application_data.answers = eligibilityData;
            //     // stringify the data object
            //     new_application_data = JSON.stringify(new_application_data);
            //     console.log(new_application_data);

            //     return $.ajax({
            //         type:'POST',
            //         url: api_base_url + "ApplicationPlugin",
            //         headers:{'Authorization':'Bearer ' + access_token,
            //                  'Content-Type': 'application/json'},
            //         data: new_application_data,
            //         success: function(json) {
            //             CreateApplicationResponse = json;
            //             application_id = CreateApplicationResponse.application;
            //             console.log(application_id);
            //         },
            //         error: function(data, status, xhr) {
            //         },
            //         complete: function(jqXHR, textStatus) {
            //         }
            //     });

            // }

            // create a new application
            function CreateNewApplication() {
                var new_application_data = new Object();
                new_application_data.survey = PluginData.survey;
                new_application_data.studycountry = PluginData.studyCountry;
                new_application_data.application = "";
                new_application_data.type = "eligibility";
                new_application_data.utmsource = utm_source;
                new_application_data.utmcontent = utm_content;
                new_application_data.utmterm = utm_term;
                new_application_data.utmcampaign = utm_campaign;
                new_application_data.utmmedium = utm_medium;
                new_application_data.country = PluginData.country;
                new_application_data.language = PluginData.language;
                new_application_data.site = selected_site;
                new_application_data.answers = eligibilityData;
                // stringify the data object
                new_application_data = JSON.stringify(new_application_data);
                console.log(new_application_data);

                return $.ajax({
                    type:'GET',
                    url: "https://guarded-tor-53502.herokuapp.com?api_type=create_application&method_type=POST&postData="+encodeURI(new_application_data),
                    crossDomain: true,
                    dataType: 'json',
                    success: function(json) {
                        CreateApplicationResponse = json;
                        application_id = CreateApplicationResponse.application;
                        console.log(application_id);
                        create_or_update_responses += 1;
                    },
                    error: function(data, status, xhr) {
                    },
                    complete: function(jqXHR, textStatus) {
                    }
                });

            }


            // // update or complete the eligibility survey results for an existing application
            // function UpdateOrCompleteEligibilitySurvey() {
            //     var new_application_data = new Object();
            //     //new_application_data.survey = PluginData.survey;
            //     new_application_data.application = application_id;
            //     new_application_data.type = "eligibility";
            //     new_application_data.answers = eligibilityData;
            //     // stringify the data object
            //     new_application_data = JSON.stringify(new_application_data);
            //     console.log(new_application_data);

            //     return $.ajax({
            //         type:'POST',
            //         url: api_base_url + "ApplicationPlugin",
            //         headers:{'Authorization':'Bearer ' + access_token,
            //                  'Content-Type': 'application/json'},
            //         data: new_application_data,
            //         success: function(json) {
            //             eligibility_survey_status = json.eligibilitySurveyStatus;
            //             console.log(eligibility_survey_status);
            //         },
            //         error: function(data, status, xhr) {
            //         },
            //         complete: function(jqXHR, textStatus) {
            //         }
            //     });
            // }

                        // update or complete the eligibility survey results for an existing application
            function UpdateOrCompleteEligibilitySurvey() {
                var new_application_data = new Object();
                //new_application_data.survey = PluginData.survey;
                new_application_data.application = application_id;
                new_application_data.type = "eligibility";
                new_application_data.answers = eligibilityData;
                // stringify the data object
                new_application_data = JSON.stringify(new_application_data);
                console.log(new_application_data);

                return $.ajax({
                    type:'GET',
                    url: "https://guarded-tor-53502.herokuapp.com?api_type=create_application&method_type=POST&postData="+encodeURI(new_application_data),
                    crossDomain: true,
                    dataType: 'json',
                    success: function(json) {
                        eligibility_survey_status = json.eligibilitySurveyStatus;
                        console.log(eligibility_survey_status);
                        create_or_update_responses += 1;
                    },
                    error: function(data, status, xhr) {
                    },
                    complete: function(jqXHR, textStatus) {
                    }
                });
            }


            // // add or update a site for an existing application
            // function AddOrUpdateSite() {
            //     var new_application_data = new Object();
            //     new_application_data.site = selected_site;
            //     new_application_data.type = "site";
            //     new_application_data.application = application_id;
            //     // stringify the data object
            //     new_application_data = JSON.stringify(new_application_data);
            //     console.log(new_application_data);

            //     return $.ajax({
            //         type:'POST',
            //         url: api_base_url + "ApplicationPlugin",
            //         headers:{'Authorization':'Bearer ' + access_token,
            //                  'Content-Type': 'application/json'},
            //         data: new_application_data,
            //         success: function(json) {
            //             eligibility_survey_status = json.eligibilitySurveyStatus;
            //             console.log(json);
            //         },
            //         error: function(data, status, xhr) {
            //         },
            //         complete: function(jqXHR, textStatus) {
            //         }
            //     });

            // }

            // add or update a site for an existing application
            function AddOrUpdateSite() {
                var new_application_data = new Object();
                new_application_data.site = selected_site;
                new_application_data.type = "site";
                new_application_data.application = application_id;
                // stringify the data object
                new_application_data = JSON.stringify(new_application_data);
                console.log(new_application_data);

                return $.ajax({
                    type:'GET',
                    url: "https://guarded-tor-53502.herokuapp.com?api_type=create_application&method_type=POST&postData="+encodeURI(new_application_data),
                    crossDomain: true,
                    dataType: 'json',
                    success: function(json) {
                        eligibility_survey_status = json.eligibilitySurveyStatus;
                        console.log(json);
                    },
                    error: function(data, status, xhr) {
                    },
                    complete: function(jqXHR, textStatus) {
                    }
                });

            }

            // update details on an existing application
            function UpdateApplicationDetails() {
                var new_application_data = new Object();
                new_application_data.application = application_id;
                new_application_data.type = "details";
                new_application_data.answers = detailsData;
                // stringify the data object
                new_application_data = JSON.stringify(new_application_data);
                console.log(new_application_data);

                return $.ajax({
                    type:'GET',
                    url: "https://guarded-tor-53502.herokuapp.com?api_type=update_application&method_type=POST&postData="+encodeURI(new_application_data),
                    crossDomain: true,
                    dataType: 'json',
                    success: function(json) {
                        console.log(json);
                    },
                    error: function(data, status, xhr) {
                    },
                    complete: function(jqXHR, textStatus) {
                    }
                });

            }


            // Load the html content from the html content file (typically content.html) into the selected page element
//            div.load(html_content_url, function() {
            $.when( $.ajax(html_content_url)).done(function(a){
                div.append(a);
                // get the Application Plugin data load from the API and return it as PluginData
                $.when( getPluginData()).done(function(a) {
                    // parse the sites and add them to the locations array
                    locations = JSON.parse(PluginData.sites);
                    if (PluginData.yourNearestStudyCenter) {
                        $("#your-nearest-study-center").html(PluginData.yourNearestStudyCenter);
                    }
                    if (PluginData.siteFinderHeader) {
                        $("#site-finder-header").html(PluginData.siteFinderHeader);
                    }
                    if (PluginData.siteFinderBody) {
                        $("#site-finder-body").html(PluginData.siteFinderBody);
                    }
                    if (PluginData.postalCodePlaceholder) {
                        $("#address").attr("placeholder", PluginData.postalCodePlaceholder);
                    }
                    if (PluginData.successHeader) {
                        $("#success-header").html(PluginData.successHeader);
                    }
                    if (PluginData.successBody) {
                        $("#success-body").html(PluginData.successBody);
                    }
                    if (!PluginData.changeButtonLabel) {
                        PluginData.changeButtonLabel = "Change";
                    }
                    if (!PluginData.selectButtonLabel) {
                        PluginData.selectButtonLabel = "Select";
                    }

                    // assign Bootstrap as the default style
                    Survey.Survey.cssType = "bootstrap";

                    // Initialize the eligibility survey.  Do not change the variable name from "survey" as localization only works
                    // when there is a survey named this way.
                    var survey = new Survey.Model(PluginData.eligibility);

                    // sets the language for localization of survey messages.  Will apply to all surveys.
                    if (language_code == "zh") {
                        // if language is Chinese, use the Chinese language code that is recognized by SurveyJS
                        survey.locale = "zh-cn";
                    }
                    else {
                        survey.locale = language_code;
                    }
                    
                    // Initialize the details survey.
                    var detailsSurvey = new Survey.Model(PluginData.details);

                    function sleep(ms) {
                      return new Promise(resolve => setTimeout(resolve, ms));
                    }

                    async function pause() {
                        while (create_or_update_calls != create_or_update_responses) {
                            if (create_or_update_calls == create_or_update_responses) {
                                break;
                            }
                            if (tries == 50) {
                                break;
                            }
                            await sleep(100);
                            tries += 1;
                        }
                    }

                   
                    // Add onComplete behaviors to the eligibility survey. This occurs when the Complete button is clicked.
                    survey.onComplete.add(function(result) {
                        // stringify the results data before removing null results
                        eligibilityData = JSON.stringify(eligibilityData);
                        // remove null results from the results data
                        eligibilityData = RemoveNullResults(eligibilityData);
                        // parse the eligibility data back into a json object because that's what we need
                        // to pass into the API
                        eligibilityData = JSON.parse(eligibilityData);
                        // send results to API
                        pause();
                        console.log(create_or_update_calls - create_or_update_responses,tries);
                        $.when( UpdateOrCompleteEligibilitySurvey()).done(function(a) {
                            // if eligibility_survey_status = passed, execute the following:
                            switch (eligibility_survey_status) {
                                case "passed":
                                    Hide( "#plugin-eligibility" ); 
                                    Show( "#plugin-map" ); 
                                    initMap();
                                    break;
                                case "failed":
                                    Hide( "#eligibility" ); 
                                    Show( "#ineligible" );
                                    break; 
                                default:
                                    // "incomplete" - the only other possible value
                                    Hide( "#eligibility" ); 
                                    Show( "#incomplete" ); 
                            }
                        });

                    });

                    
                    survey.onCurrentPageChanged.add(function(result) {
                        // if sendResultOnPageNext is true (this is a survey setting in Salesforce),
                        // and if the string is not empty, send the partial result to the API.  If not, skip this.
                        if (JSON.parse(PluginData.eligibility).sendResultOnPageNext && JSON.stringify(eligibilityData) != "{}") {
                            // if the application record hasn't been created yet, create it
                            if (application_id == "") {
                                create_or_update_calls += 1;
                                CreateNewApplication();
                            } else {
                                // update the existing application with new or changed results data
                                create_or_update_calls += 1;
                                UpdateOrCompleteEligibilitySurvey();
                            }
                        }
                    });

                    detailsSurvey.onComplete.add(function(result) {
                        // hide the details survey
                        Hide( "#details-container" );
                        // show the success page
                        Show( "#success-container" ); 
                        // stringify the details results data before removing null results
                        detailsData = JSON.stringify(detailsData);
                        // remove null results from the details results data
                        detailsData = RemoveNullResults(detailsData);
                        // parse the details results data back into a json object because that's what we need
                        // to pass into the API
                        detailsData = JSON.parse(detailsData);
                        // send results to API
                        UpdateApplicationDetails();
                    });

                    $("#eligibility").Survey({
                        model: survey,
                        data: eligibilityData
                    });

                    $("#details").Survey({
                        model: detailsSurvey,
                        data: detailsData
                    });

                }); // end of getPluginData block

            });  // end of when block that starts with getting html content and access token

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
                // send selected site info to API 
            });
            $(document).on('click', '#change-location', function() {
                Show( "#site-finder-container" ); 
                Hide( "#details-container" ); 
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

            (function($) {
                $.fn.hasScrollBar = function() {
                    return this.get(0).scrollHeight > this.height();
                }
            })(jQuery);

            $.fn.plugin = function() {
                return {
                    AddOrUpdateSite: function() {
                        AddOrUpdateSite();
                    }
                }
            };

            function RemoveNullResults(a) {
                // Upon completion of a survey, SurveyJS adds null results for comment fields to
                // the result data, even if comments is disabled for all of the survey questions.  These must be
                // stripped out to prevent them from being entered into the Application record
                // through the API.
                // Note that the input string 'a' must already be stringified JSON
                //
                // create variable to hold the new result JSON
                var new_a = "";
                // split the results data into segments on all commas
                a_segments = a.split(',');
                // iterate through all the segments
                for (var i=0; i < a_segments.length; i++) {
                    // check to see if the segment has a ':'.  If not, it can be added to the new result string right away.
                    if (a_segments[i].indexOf(':') >= 0) {
                        // get the location of the ':'
                        a = a_segments[i].indexOf(':');
                        // check to see if the value after the colon is "null"
                        if (a_segments[i].substring(a+1,a+5) != "null") {
                            // check to see if this is not the first segment.
                            if (i > 0) {
                                // add a comma if there is already content in the new results string
                                if (new_a != "") {
                                    new_a += ",";
                                // otherwise, add a '{'. This will be necessary if the first segment contains a null value.    
                                } else {
                                    new_a += "{";
                                }
                            }
                            // since this is the first segment and it does not have a null value, add it to the new results string.
                            new_a += a_segments[i];
                        }
                    // this segment does not contain a ':' - add it to the new results string.    
                    } else {
                        // if there is already content in the new results string, add a comma before adding this segment
                        if (new_a !== "{") { new_a += ","};
                        new_a += a_segments[i];
                    }
                }
                // check to see if the new results string includes a '}'.  If not, add one.  This will be necessary if the last
                // segment in the results data contains a null value.
                if (new_a.indexOf('}') < 0) {new_a += "}"};
                // return the new results string
                return new_a;
            }

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
        var uluru = {lat: Number(PluginData.latitude), lng: Number(PluginData.longitude)}; // Center of Study Country, from PluginData
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 4,
            center: uluru 
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
            d1.insertAdjacentHTML('beforeend', '<hr/><div><div style="width:20%;float:left;min-height:1px">'+a+'</div><div style="width:60%;display:inline-block;text-align:left">'+locations[i].name+'<br/>'+locations[i].street+'<br/>'+locations[i].city+'<br/>'+locations[i].state+', '+locations[i].zip+'</div><div style="width:20%;display:inline-block;min-height:1px;text-align:bottom-right"><button id="location-'+i+'" class="site-selector">'+PluginData.selectButtonLabel+'</button></div></div>');
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
        // set the selected site variable equal to the salesforce id of the clicked site
        selected_site = locations[i].id;

        // init the jQuery plugin that exposes the AddOrUpdateSite function
        var test = $('node').plugin();
        // now update the Application with the new or changed site
        test.AddOrUpdateSite();

        // add 1 so the marker numbers don't start at 0 like the marker array identifiers
        var a = i + 1;
        // get the page element to which we need to add the selected site
        var d1 = document.getElementById('selected-site');
        // delete any html already attached to that element (like a previously selected site)
        d1.innerHTML="";
        // add new html to display the selected site
        d1.insertAdjacentHTML('beforeend', '<div style="text-align:center"><div style="width:20%;float:left;min-height:1px">'+a+'</div><div id="selected-site-name" style="width:60%;display:inline-block">'+locations[i].name+'</div><div style="width:20%;display:inline-block;min-height:1px;text-align:bottom-right"><button id="change-location">'+PluginData.changeButtonLabel+'</button></div></div><hr/>');
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
