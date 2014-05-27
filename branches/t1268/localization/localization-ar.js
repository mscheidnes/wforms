// Localization for FormAssembly.com / wForms v3.0
// عربي [Arabic] - March 5, 2009, 1:16 pm
wFORMS.behaviors.validation.messages = {
	isRequired 		: "	هذه الخانة مطلوبة.",
	isAlpha 		: "نرجوا إدخال حروف فقط (أ-ي) الأرقام غير مسموحة.",
	isEmail 		: "عنوان بريد إلكتروني غير صحيح",
	isInteger 		: "رجاء أدخل أرقاما (بدون أجزاء)",
	isFloat 		: "رجاء أدخل أرقاما (مثلا 1،9)",
	isAlphanum 		: "رجاء استخدام الحروف  الهجائية والأرقام فقط  ( أ-ي  1-9)",
	isDate 			: "التاريخ غير صحيح",
	isPhone			: "",
	isCustom		: "",
	notification_0	: "The form is not complete and has not been submitted yet. There is one problem with your submission.",
	notification	: "The form is not complete and has not been submitted yet. There are %% problems with your submission."
}

wFORMS.behaviors.repeat.MESSAGES = {
	ADD_CAPTION 	: "اضف إجابة أخرى",
	ADD_TITLE 		: "",
	REMOVE_CAPTION 	: "حذف",
	REMOVE_TITLE 	: ""
}

wFORMS.behaviors.paging.MESSAGES = {
	CAPTION_NEXT 	 : 'الصفحة التالية',
	CAPTION_PREVIOUS : 'الصفحة السابقة',
	CAPTION_UNLOAD	 : ''
}


// Alpha Input Validation:
wFORMS.behaviors.validation.instance.prototype.validateAlpha = function(element, value) {
	var reg =  /^[\u0600-\u06FF]+$/;
	return this.isEmpty(value) || reg.test(value);
}
// Alphanumeric Input Validation:
wFORMS.behaviors.validation.instance.prototype.validateAlphanum = function(element, value) {
	var reg =  /^[\u0030-\u0039\u0600-\u06FF]+$/;
	return this.isEmpty(value) || reg.test(value);
}

wFORMS.behaviors.autoformat.NUMERIC_REGEX = new RegExp("[0-9]");
wFORMS.behaviors.autoformat.ALPHABETIC_REGEX = new RegExp("[\u0600-\u06FF]");
