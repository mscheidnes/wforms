// Localization for FormAssembly.com / wForms v3.2
// Español - August 26, 2010, 1:13 pm
wFORMS.behaviors.validation.messages = {
	oneRequired 	: "Sección obligatoria",
	isRequired 		: "Campo obligatorio. ",
	isAlpha 		: "Solo se admiten letras (a-z A-Z). No se permiten números.",
	isEmail 		: "No es una dirección de correo electrónico válida.",
	isInteger 		: "Introduzca un valor numérico (sin decimales).",
	isFloat 		: "Introduzca un valor decimal (ej: 1.9) .",
	isAlphanum 		: "Utilice únicamente caracteres alfanuméricos (a-z 0-9).",
	isDate 			: "La fecha no es válida",
	isPhone			: "Por favor ingrese un número telefónico válido",
	isCustom		: "Por favor ingrese un dato válido",
	notification_0	: "Se ha encontrado %% error. El formulario no se ha enviado. Verifique los datos introducidos.",
	notification	: "Se han encontrado %% errores. El formulario no se ha enviado. Verifique los datos introducidos."
}

wFORMS.behaviors.repeat.MESSAGES = {
	ADD_CAPTION 	: "Agregar otra respuesta",
	ADD_TITLE 		: "Se duplicará esta pregunta o sección.",
	REMOVE_CAPTION 	: "Eliminar",
	REMOVE_TITLE 	: "Borrará esta pregunta o sección."
}

wFORMS.behaviors.paging.MESSAGES = {
	CAPTION_NEXT 	 : 'Página siguiente',
	CAPTION_PREVIOUS : 'Página anterior',
	CAPTION_UNLOAD	 : 'Todo dato introducido en CUALQUIER PÁGINA de este formulario se PERDERÁ'
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

// Calendar
if(!wFORMS.helpers.calendar) {
	wFORMS.helpers.calendar = {};
}
if(!wFORMS.helpers.calendar.locale) {
	wFORMS.helpers.calendar.locale = {};
}
var cfg = wFORMS.helpers.calendar.locale;

cfg.TITLE 				= 'Selecciona una fecha';
cfg.START_WEEKDAY 		= 1;
cfg.MONTHS_LONG			= [	'Enero',
							'Febrero',
							'Marzo',
							'Abril',
							'Mayo',
							'Junio',
							'Julio',
							'Agosto',
							'Septiembre',
							'Octubre',
							'Noviembre',
							'Diciembre'
							];
cfg.WEEKDAYS_SHORT		= [ 'Do',
							'Lu',
							'Ma',
							'Mi',
							'Ju',
							'Vi',
							'Sa'
							];
cfg.MDY_DAY_POSITION 		= 1;
cfg.MDY_MONTH_POSITION 		= 2;
cfg.MDY_YEAR_POSITION		= 3;
cfg.DATE_FIELD_DELIMITER	= '/';
