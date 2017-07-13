/*
 * Here is the script that gets added to the body of the page calling this plugin:
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
    var base_url;
    var utm_source;
    var utm_medium;
    var utm_campaign;
    var utm_term;
    var utm_content;
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

    // Following gets the  base url of this script's hosting location.  May need to use this if other assets
    // are hosted at the same place.
    //
    // asset_url = base_url + "something here";

    // Following parses the param string of script_url and assigns values to
    // the five utm parameter variables.
    // var hashes = script_url.slice(script_url.indexOf('?') + 1).split('&');
    //    for (var i=0; i < hashes.length; i++) {
    //     hash = hashes[i].split('=');
    //     switch (hash[0]) {
    //         case 'param1':  
    //             param1 = hash[1];
    //             break;
    //         case 'param2':
    //             param2 = hash[1];
    //             break;
    //         case 'param3':
    //             param3 = hash[1];
    //             break;
    //         case 'param4':
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

    var scripts = [
        // Loads the most current version of jQuery.  If this plugin is to be used in third party websites
        // where older versions of jQuery are already loaded and are required, will need to modify this
        // to check for jQuery and use it if already loaded
        {"name": "jQuery", "src": "https://unpkg.com/jquery"},
        {"name": "SurveyJS", "src": "https://surveyjs.azureedge.net/0.12.19/survey.jquery.js"},
        {"name": "Custom", "src": base_url + "custom.js"},
    ];

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
        AddStylesheet('custom', base_url + "custom.css");

        // get the parameters passed into the page so that we can carry these forward if necessary
        // for example, to determine the country or language or get utm parameters
        var params = getUrlVars();

        getUTMParameters(params);

        console.log(utm_source,utm_campaign,utm_content,utm_term,utm_medium);

        main();  
    }

    /* ---------------------------------------------------------------------------------
     * getUTMParameters(params)
     * ---------------------------------------------------------------------------------
     * Searches through the params array for UTM Parameters and assigns their values to
     * utm parameter variables
     * --------------------------------------------------------------------------------- */
    function getUTMParameters (params) {

        var hashes = script_url.slice(script_url.indexOf('?') + 1).split('&');
        for (var i=0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            switch (hash[0]) {
                case 'utm_campaign':  
                    utm_campaign = hash[1];
                    break;
                case 'utm_content':
                    utm_content = hash[1];
                    break;
                case 'utm_term':
                    utm_term = hash[1];
                    break;
                case 'utm_medium':
                    utm_medium = hash[1];
                    break;
                case 'utm_source':
                    utm_source = hash[1];
                    break;
        }
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
        jQuery(document).ready(function($) {

            // This is the id value of the div to which the entire plugin will be appended.
            var div = $("#nroll-plugin");
            div.load(base_url+'content.html', function() {
                var surveyJSON = {completeText:"What is this",pages:[{name:"country",elements:[{type:"dropdown",name:"country",title:"What is your country of residence?",isRequired:true,choices:["Afghanistan","Aland Islands","Albania","Algeria","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia, Plurinational State of","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo","Congo, the Democratic Republic of the","Cook Islands","Costa Rica","Cote d’Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands (Malvinas)","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (Vatican City State)","Honduras","Hungary","Iceland","India","Indonesia","Iran, Islamic Republic of","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea, Democratic People’s Republic of","Korea, Republic of","Kuwait","Kyrgyzstan","Lao People’s Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libyan Arab Jamahiriya","Liechtenstein","Lithuania","Luxembourg","Macao","Macedonia, the former Yugoslav Republic of","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Moldova, Republic of","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Qatar","Reunion","Romania","Russian Federation","Rwanda","Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Taiwan","Tajikistan","Tanzania, United Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela, Bolivarian Republic of","Vietnam","Virgin Islands, British","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"]}],navigationButtonsVisibility:"show"},{name:"age",elements:[{type:"checkbox",name:"Are you 18 years or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"asthma",elements:[{type:"checkbox",name:"Are you recently diagnosed with mild-moderate asthma?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],innerIndent:2,navigationButtonsVisibility:"show"},{name:"inhaler",elements:[{type:"checkbox",name:"Typically, do you use an inhaler more than twice daily?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"exercise",elements:[{type:"checkbox",name:"Do you undertake exercise more than three times per week?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"},{name:"bmi",elements:[{type:"checkbox",name:"Do you have a BMI of 35 or over?",title:"Do you have a BMI of 35 or over?",isRequired:true,choices:[{value:"no",text:"No"},{value:"yes",text:"Yes"}],colCount:2}],navigationButtonsVisibility:"show"}],showProgressBar:"top",showQuestionNumbers:"off",title:"Title of the survey"}
                var data = {};   
                Survey.Survey.cssType = "bootstrap";
                var survey = new Survey.Model(surveyJSON);
                survey.onComplete.add(function(result) {
                    document.querySelector('#surveyResult').innerHTML = "result: " + JSON.stringify(result.data);
                });
                $("#surveyElement").Survey({
                    model: survey,
                    data: data
                });

            });
            
       }); // end jquery.documentready

        /*** NOTE - ANY FUNCTIONS DEFINED OUT HERE WILL NOT HAVE ACCESS TO JQUERY PROPERLY DUE TO jQuery.noConflict(true) ***/

    } // end main()

    // Get the query string parameters passed into this page
    // not used at the moment
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

})(); // immediately call our anonymous function here...
