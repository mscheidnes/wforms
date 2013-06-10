/* Copyright 2009 Veer West LLC - http://www.formassembly.com
 * replace %%variable_aliases%% in form's HTML sections with querystring parameters.
 */

(function() {
    if (typeof(wFORMS) == "undefined") {
        throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
    }

    //an empty instance and empty behavior merely for maintaining consistency with wForms behavior interface
    var instance = {
        applyTo: function(){

        }
    };

    wFORMS.behaviors.replaceVariable = {
        instance: function(){
            return instance;
        }
    };

    var replaceFormVariables = function() {
		var params = getParameters();
		
		for(key in params) { // pseudo-loop just to check that object is not empty		
			var forms  = document.getElementsByTagName('FORM');
			for (var i=0;i<forms.length;i++) {
				replaceVariables(forms[i],params);
			}		
			break; 
		}
	};
	var getParameters = function() {
		var param = Array();
		var q = document.location.search;
		if(q.length==0) 
			return;
	    var v = q.split('?')[1].split('&');
	    for(var i=0;i<v.length;i++) {
			//decodeSpecialCharacters passed in through queryString.
			var name = v[i].split('=')[0];
			if(name!='url') {
				// skip url parameter (used by FA mod_rewrite) 
		    	param[name] = decodeURIComponent(v[i].split('=')[1]);
		    }
	    }
	   	return param;
	};
	var _addEvent = function(obj, type, fn) {
		if(!obj) { return; }
		
		if (obj.attachEvent) {
			obj['e'+type+fn] = fn;
			obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
			obj.attachEvent( 'on'+type, obj[type+fn] );
		} else if(obj.addEventListener) {			
			obj.addEventListener( type,fn, false );
		} else {
			var originalHandler = obj["on" + type]; 
			if (originalHandler) { 
			  obj["on" + type] = function(e){originalHandler(e);fn(e);}; 
			} else { 
			  obj["on" + type] = fn; 
			} 
		}
	};
	var replaceVariables = function(form,vars){
		if(!form['tfa_dbFormId']) {
	    	// skip non-formassembly.com forms
	    	return;
	    } 
		base2.DOM.Element.querySelectorAll(document,'.htmlsection, .htmlSection').forEach(function(e){
			for(var name in vars){
				var match = new RegExp("%%"+name+"%%","g");
				e.innerHTML = e.innerHTML.replace(match,vars[name]);				
			}
		});
	};
	_addEvent(window,'load',replaceFormVariables);
})();