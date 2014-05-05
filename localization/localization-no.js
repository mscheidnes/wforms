// Localization for FormAssembly.com / wForms v3.0
// Norsk - October 27, 2009, 4:19 pm
wFORMS.behaviors.validation.messages = {
	isRequired 		: "Dette feltet er obligatorisk.",
	isAlpha 		: "The text must use alphabetic characters only (a-z, A-Z). Numbers are not allowed.",
	isEmail 		: "Dette ser ut som du ikke har lagt til en gyldig epostadresse.",
	isInteger 		: "Vennligst fyll ut.",
	isFloat 		: "Vennligst fyll inn f.eks 1.0",
	isAlphanum 		: "Please use alpha-numeric characters only [a-z 0-9].",
	isDate 			: "Dette er ikke en gyldig dato ",
	isPhone			: "Please enter a valid phone number.",
	isCustom		: "Please enter a valid value.",
	notification_0	: "%% feil ble oppdaget. Skjemaet har enda ikke blitt sendt.\\nVennligst sjekk informasjonen du har angitt.",
	notification	: "%% feil ble oppdaget. Skjemaet har enda ikke blitt sendt.\\nVennligst sjekk informasjonen du har angitt."
}

wFORMS.behaviors.repeat.MESSAGES = {
	ADD_CAPTION 	: "Legg til ekstra felt",
	ADD_TITLE 		: "Vil duplisere dette spørsmålet eller avsnittet",
	REMOVE_CAPTION 	: "Fjern",
	REMOVE_TITLE 	: "Will remove this question or section"
}

wFORMS.behaviors.paging.MESSAGES = {
	CAPTION_NEXT 	 : 'Neste side',
	CAPTION_PREVIOUS : 'Forrige side',
	CAPTION_UNLOAD	 : 'Any data entered on ANY PAGE of this form will be LOST'
}


// Alpha Input Validation:
wFORMS.behaviors.validation.instance.prototype.validateAlpha = function(element, value) {
	var reg =  /^[a-zA-Z\s\u00C0-\u00FF]+$/;
	return this.isEmpty(value) || reg.test(value);
}
// Alphanumeric Input Validation:
wFORMS.behaviors.validation.instance.prototype.validateAlphanum = function(element, value) {
	var reg =  /^[\u0030-\u0039a-zA-Z\s\u00C0-\u00FF]+$/;
	return this.isEmpty(value) || reg.test(value);
}

wFORMS.behaviors.autoformat.NUMERIC_REGEX = new RegExp("[0-9]");
wFORMS.behaviors.autoformat.ALPHABETIC_REGEX = new RegExp("[a-zA-Z\u00C0-\u00FF]");

// Calendar
if(!wFORMS.helpers.calendar) {
	wFORMS.helpers.calendar = {};
}
if(!wFORMS.helpers.calendar.locale) {
	wFORMS.helpers.calendar.locale = {};
}
var cfg = wFORMS.helpers.calendar.locale;

cfg.TITLE 				= 'Select a date';
cfg.START_WEEKDAY 		= 1;
cfg.MONTHS_LONG			= [	'January',
							'February',
							'March',
							'April',
							'May',
							'June',
							'July',
							'August',
							'September',
							'October',
							'November',
							'December'
							];
cfg.WEEKDAYS_SHORT		= [ 'Su',
							'Mo',
							'Tu',
							'We',
							'Th',
							'Fr',
							'Sa'
							];
cfg.MDY_DAY_POSITION 		= 1;
cfg.MDY_MONTH_POSITION 		= 2;
cfg.MDY_YEAR_POSITION		= 3;
cfg.DATE_FIELD_DELIMITER	= '/';
