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
    var base_url;
    // var asset_url;  //  may want to use this if the assets are in different location than the nroll script
    // var param1;  // first parameter from script_url;
    // var param2;  // second parameter from script_url;
    // var param3;  // third parameter from script_url;
    // var param4;  // fourth parameter from script_url;
 
    /*
     * iterate through the loaded scripts looking for this one (must specify "nroll-script" on the id tag for this to work)
     * Once we find the current script we get its source and use the source as the base for finding other assets
     * This only matters if other assets (css, html, etc.) are hosted in the same place as this script
     * if not, need to identify the source of the other assets in a different way.
     * an alternative implementation would be to look for this script's filename in the title which would fail if we were to
     * change the name of the script
    **/

    for (var i=0; i < all_scripts.length; i++) {
        if (all_scripts[i].id == "nroll-script") {
            script_url = all_scripts[i].src;
        }
    }

    // following gets the base url of the plugin  
    // For the moment, this is the prefix used for retrieving all plugin assets
    base_url  = script_url.substring(0,script_url.lastIndexOf("/") + 1);

    // Following gets the url to the assets.  May need to use this if assets are in a different location
    // than the nroll script
    // This is the prefix used for all api calls
    // asset_url = base_url + "something here";

    // Following parses the param string of script_url and assigns values to
    // param1, param2, param3, and param4.
    // var hashes = script_url.slice(script_url.indexOf('?') + 1).split('&');
    // for (var i=0; i < hashes.length; i++) {
    //     hash = hashes[i].split('=');
    //     switch (hash[0]) {
    //         case 'param1_name':  
    //             param1 = hash[1];
    //             break;
    //         case 'param2_name':
    //             param2 = hash[1];
    //             break;
    //         case 'param3_name':
    //             param3 = hash[1];
    //             break;
    //         case 'param4_name':
    //             param4 = hash[1];
    //             break;
    //     }
    // }

    // // following validates param1.  Returns the input if valid or an empty string if not.
    // param1 = ValidateParam1(param1);

    // // following validates param2.  Returns the input if valid or an empty string if not.
    // param2 = ValidateParam2(param2);

    // // following validates param3.  Returns the input if valid or an empty string if not.
    // param3 = ValidateParam3(param3);

    // // following validates param4.  Returns the input if valid or an empty string if not.
    // param4 = ValidateParam4(param4);


    // Chain load the scripts here in the order listed below...
    // when the last script in the chain is loaded, main() will be called
    // IMPORTANT: jQuery must be the first script in the list!!!!  If it is not
    // and there is a copy of jQuery 3.2.1 already loaded, the first
    // script in the list will be skipped.

    var scripts = [
        // {"name": "jQuery", "src": "https://code.jquery.com/jquery-3.2.1.min.js", "custom_load": JQueryCustomLoad },
        {"name": "jQuery", "src": "https://unpkg.com/jquery"},
        // IMPORTANT: jQuery will be loaded into the custom alias "jQnroll" below.  All scripts that
        // are loaded and that would otherwise refer to "jQuery" need to be modified to 
        // refer to "jQnroll".
        // Note that the following SurveyJS script has been customized to use jQnroll
//        {"name": "SurveyJS", "src": base_url + "survey-0.12.18-custom.jquery.js"},
        {"name": "SurveyJS", "src": "https://surveyjs.azureedge.net/0.12.18/survey.jquery.js"},
        {"name": "Custom", "src": base_url + "custom.js"},
        //{"name": "GoogleMaps", "src": "https://maps.googleapis.com/maps/api/js?key=AIzaSyDV9iKalrE9WbGJMceb9vKM9nmjYqZD0rc"},
    ];

    // Set the scripts_counter to 0.  This is incremented as the scripts are loaded
    // and used to keep track of progress through the script list.

    scripts_counter = 0;

    //Start Loading Scripts

    if (window.jQuery === undefined || window.jQuery.fn.jquery != '3.2.1') {

        // Load our version of jQuery and start chain here...
        CreateScriptTag(scripts[0].name, scripts[0].src);   

    } else {

        // Version of jQuery already loaded is fine
        // Change alias to jQnroll as that is what main() and other scripts now need.
        // This needs to be fixed - need to move existing copy of jQuery to a new namespace,
        // then load new copy and assign new copy to jQnroll namespace, then move existing
        // version back to jQuery namespace.  Otherwise, other page elements that depend
        // on the existing copy won't work.
//         jQnroll = window.jQuery.noConflict();
        jQuery = window.jQuery.noConflict();

        // Load starting with the second script (skip jQuery)
        CreateScriptTag(scripts[1].name, scripts[1].src);
    }


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

        // Check to see if the custom_load attribute was set on the last script
        // to be loaded, and if it was, call the function that is passed in.
        // At the moment, this is only used to change the namespace and set the no-conflict property
        // for jQuery.

        if (scr.custom_load) {
            
            scr.custom_load.call(params);
        }

        // Now advance the scripts_counter

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

        // AddStylesheet('cbw-reset', base_url + "cbwreset.css");
        AddStylesheet('bootstrap', "https://unpkg.com/bootstrap@3.3.7/dist/css/bootstrap.min.css");
        AddStylesheet('custom', base_url + "custom.css");
        // added reset styles to cbwidget.css
        // AddStylesheet('cbw-css-sel2', base_url + "select2.css");
        // AddStylesheet('cbw-css', base_url + "cbwidget.css");
        // AddStylesheet('cbw-googlefonts', "https://fonts.googleapis.com/css?family=Montserrat:400,700");
        // AddStylesheet('font-awesome', "//netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css");

        // get the parameters passed into the page so that we can carry these forward if necessary
        // for example, as part of the process of determining the landing page or promotion id
        var params = getUrlVars();

        // set the ReferringPath variable equal to blank.  This will be updated with a real param in
        // GetReferringPathAndCause if one exists, otherwise it ensures the param will be passed
        // with the api call.
        // ReferringPath = "";

        // set the CBCauseID variable equal to blank.  Ensures the param will be passed with the api call.
        // This will be updated with a real param in GetReferringPathAndCause if one exists.
        // CBCauseID = "";

        // set the FilteredParamString variable equal to blank.  This will only change if the params.length
        // is > 0, which will result in a call to GetReferringPathAndCause(params).
        // FilteredParamString = "";

        // now check to see if the page url params contains a referral path or a cause ID.  If it does,
        // the FilteredParamString variable will be populated with all the params except the referral 
        // path params and/or the cause ID, and the ReferringPath and CBCauseID variables will be set 
        // to the correct values.
        // if (params.length > 0) {
        //     GetReferringPathAndCause(params);
        // }

        main();  
    }

    /* ----------------------------------------------------------------------- 
     * JQueryCustomLoad
     * ----------------------------------------------------------------------- 
     * JQuery custom load handler action, right now this just sets the 
     * noConflict option of jQuery to true. This is called from the generic
     * ScriptLoadHandler due to the custom_load action on the script object
     * in the scripts array.
     *************************************************************************/
    function JQueryCustomLoad(params) {
        // IMPORTANT: Some JS files may have been modified
        // from thier original versions.  Instead of looking for the alias "jQuery", they
        // look for an instance of jQuery loaded under the alias "jQnroll", which is how
        // we load jQuery in the CustomLoad function below and how we access it in the
        // document.ready call in main().
        jQuery = window.jQuery.noConflict(true);
//         jQnroll = window.jQuery.noConflict();
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
     * ValidateParam2(target)
     * ---------------------------------------------------------------------------------
     * This function is called to validate a widget url target input.  If the target
     * input is valid, it is returned, otherwise null is returned.  At the moment, the
     * only valid inputs are "local" and "default", but at some point we may allow 
     * specific urls to be passed in, in which case we'll have to test for a valid url
     * pattern here.
     * --------------------------------------------------------------------------------- */
    // function ValidateParam2(target) {

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
     * ValidateParam3(param3)
     * ---------------------------------------------------------------------------------
     * This function is called to validate a widget url auto button input.  If the param4
     * input is valid, it is returned, otherwise null is returned.  At the moment, the
     * only valid inputs are "left", "right", "none", and "test", but at some point we may allow 
     * additional values.  Note that the values "none" and "test", when passed in via
     * the load script url, will supercede values from the api response.
     * --------------------------------------------------------------------------------- */
    // function Validateparam4(param4) {

    //     var param4_valid = false;
    //     var arr = [ "left", "right", "none", "test" ];

    //     for (var i = 0; i < arr.length; i++) {
    //         if (arr[i] == param4) {
    //             param4_valid = true;
    //         }
    //     }

    //     if (!param4_valid) {
    //         param4 = "";
    //     }
    //     return param4;
    // }

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
        // IMPORTANT: JS files that depend on jQuery have been modified
        // from thier original versions.  Instead of looking for the alias "jQuery", they
        // look for an instance of jQuery loaded under the alias "jQnroll", which is how
        // we load jQuery in the CustomLoad function above and how we access it in the
        // document.ready call in main() that follows.
//         jQnroll(document).ready(function($) {
        jQuery(document).ready(function($) {

            // This is the id value of the div to which the entire plugin will be appended.
            var div = $("#nroll-plugin");
            div.load(base_url+'content.html', function() {
                // var surveydiv = $("#surveyScript");
                // surveydiv.load(base_url+'survey.js.html');
                var surveyJSON = {completeText:"What is this",pages:[{name:"country",elements:[{type:"dropdown",name:"country",title:"What is your country of residence?",isRequired:true,choices:["Afghanistan","Aland Islands","Albania","Algeria","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia, Plurinational State of","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo","Congo, the Democratic Republic of the","Cook Islands","Costa Rica","Cote d’Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands (Malvinas)","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (Vatican City State)","Honduras","Hungary","Iceland","India","Indonesia","Iran, Islamic Republic of","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea, Democratic People’s Republic of","Korea, Republic of","Kuwait","Kyrgyzstan","Lao People’s Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libyan Arab Jamahiriya","Liechtenstein","Lithuania","Luxembourg","Macao","Macedonia, the former Yugoslav Republic of","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Moldova, Republic of","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Qatar","Reunion","Romania","Russian Federation","Rwanda","Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Taiwan","Tajikistan","Tanzania, United Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela, Bolivarian Republic of","Vietnam","Virgin Islands, British","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"]}],navigationButtonsVisibility:"show"},{name:"age",elements:[{type:"checkbox",name:"Are you 18 years or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"asthma",elements:[{type:"checkbox",name:"Are you recently diagnosed with mild-moderate asthma?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],innerIndent:2,navigationButtonsVisibility:"show"},{name:"inhaler",elements:[{type:"checkbox",name:"Typically, do you use an inhaler more than twice daily?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"exercise",elements:[{type:"checkbox",name:"Do you undertake exercise more than three times per week?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"bmi",elements:[{type:"checkbox",name:"Do you have a BMI of 35 or over?",title:"Do you have a BMI of 35 or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"}],showProgressBar:"top",showQuestionNumbers:"off",title:"Title of the survey"}
                var data = {country:["Albania"]};    
                Survey.Survey.cssType = "bootstrap";
                var survey = new Survey.Model(surveyJSON);
                survey.onComplete.add(function(result) {
                    document.querySelector('#surveyResult').innerHTML = "result: " + JSON.stringify(result.data);
                });
                $("#surveyElement").Survey({
                    model: survey,
                    data: data
                });

                // $.get(base_url+'surveyJSON.html')
                //     .done(function(data) {
                //         var surveyJSON = data;
                //         console.log(surveyJSON);
                // });

            });
            
       }); // end jquery.documentready

        /*** NOTE - ANY FUNCTIONS DEFINED OUT HERE WILL NOT HAVE ACCESS TO JQUERY PROPERLY DUE TO jQuery.noConflict(true) ***/

    } // end main()

    // Get the query string parameters passed into this page
    function getUrlVars() {

        var vars = [], hash;

        if (window.location.href.indexOf('?') >= 0) {

            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

            for (var i=0; i < hashes.length; i++) {

                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }

        }
        return vars;
    }

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

    /* ---------------------------------------------------------------------------------
     * GetReferringPathAndCause(params)
     * ---------------------------------------------------------------------------------
     * Searches through the params array for referral path values with names that
     * match the sources of paths.  Currently supporting two variations of Awe.sm links
     * and 'cblink' links.
     * --------------------------------------------------------------------------------- */
    // function GetReferringPathAndCause (params) {

    //     var h1, h2;
    //     FilteredParamString = '?';
    //     for (var i = 0, l = params.length; i < l; i++) {
    //         h1 = params[i];
    //         h2 = params[h1];
    //         if (h1 == 'awesm' && h2 && h2.indexOf('awe.sm_') == 0) {
    //             ReferringPath = h2.substring(7);
    //         } else if (h1 == 'fb_ref' && h2 && h2.indexOf('awesm') == 0) {
    //             ReferringPath = decodeURIComponent(h2).substring(13);
    //         } else if (h1 == 'cblink') {
    //             ReferringPath = h2;
    //         } else if (h1 == 'cbcause') {
    //             CBCauseID = h2;
    //         } else {
    //             if (FilteredParamString != '?') {
    //                 FilteredParamString += "&";
    //             }
    //             FilteredParamString += h1 + "=" + h2
    //         }
    //     }
    //     // If the Filtered Param String still just contains ?, reset it to a blank string
    //     if (FilteredParamString == '?') {
    //         FilteredParamString = "";
    //     }
    // }

})(); // immediately call our anonymous function here...
