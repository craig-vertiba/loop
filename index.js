Survey.Survey.cssType = "bootstrap";
Survey.defaultBootstrapCss.navigationButton = "btn btn-green";

window.survey = new Survey.Model( { questions: [
     {name:"name", type:"text", title: "Please enter your name:", placeHolder:"Jon Snow", isRequired: true},
     {name:"birthdate", type:"text", inputType:"date", title: "Your birthdate:", isRequired: true},
     {name:"color", type:"text", inputType:"color", title: "Your favorite color:"},
     {name:"email", type:"text", inputType:"email", title: "Your e-mail:", placeHolder:"jon.snow@nightwatch.org", isRequired: true, validators: [{type:"email"}]}
]});
survey.onComplete.add(function(result) {
	document.querySelector('#surveyResult').innerHTML = "result: " + JSON.stringify(result.data);
});


$("#surveyElement").Survey({model:survey});
