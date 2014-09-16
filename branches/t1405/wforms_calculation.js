
if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}
/**
 * wForms calculation behavior.
 */
wFORMS.behaviors.calculation  = {

    // Allow behavior to be ignored.
    skip: false,

    /**
     * Selector expression for the variable used in a calculation
     * @final
     * @see http://www.w3.org/TR/css3-selectors/
     */
    VARIABLE_SELECTOR_PREFIX : "calc-",

    /**
     * Behavior uses value defined in the class with this prefix if available (e.g. calcval-9.99)
     * otherwise uses field value property.
     */
    CHOICE_VALUE_SELECTOR_PREFIX : "calcval-",

    /**
     * Suffix of the ID for the hint element
     * @final
     */
    CALCULATION_SELECTOR : '*[class*="formula="]',

    /**
     * The error message displayed next to a field with a calculation error
     */
    CALCULATION_ERROR_MESSAGE : "There was an error computing this field.",

    /**
     * Creates new instance of the behavior
     * @constructor
     */
    instance : function(f) {
        this.behavior = wFORMS.behaviors.calculation;
        this.target = f;
        this.calculations = [];
        //this.variables = [];
    }
}

/**
 * Factory Method.
 * Applies the behavior to the given HTML element by setting the appropriate event handlers.
 * @param {domElement} f An HTML element, either nested inside a FORM element or (preferably) the FORM element itself.
 * @return {object} an instance of the behavior
 */
wFORMS.behaviors.calculation.applyTo = function(f) {

    // Allow behavior to be ignored.
    if(wFORMS.behaviors.calculation.skip) {
        return null;
    }

    while(f && f.tagName!='FORM') {
        f = f.parentNode;
    }

    var b = wFORMS.getBehaviorInstance(f,'calculation');
    if(!b) {
        b = new wFORMS.behaviors.calculation.instance(f);
    } else {
        b.calculations = [];
    }

    if(wFORMS.behaviors.repeat && !b._repeatRemoveHandler) {
        var _callback = wFORMS.behaviors.repeat.onRemove;
        b._repeatRemoveHandler = function() {
            wFORMS.behaviors.calculation.applyTo(f);
            if(_callback) _callback.apply(this, arguments);
        }
        wFORMS.behaviors.repeat.onRemove = b._repeatRemoveHandler;
    }

    base2.DOM.Element.querySelectorAll(f,wFORMS.behaviors.calculation.CALCULATION_SELECTOR).forEach(
        function(elem){
            // extract formula
            var formula = elem.className.substr(elem.className.indexOf('formula=')+8).split(' ')[0];

            var variables = formula.split(/[^a-zA-Z]+/g);
            b.varFields = [];

            // process variables, add onchange/onblur event to update total.
            for (var i = 0; i < variables.length; i++) {
                if(variables[i]!='') {

                    /*
                    Binding with forEach sometime fails when using this, resulting in undefined 'variable' parameter.
                        f.querySelectorAll("*[class*=\"...\"]");
                    Library call works fine: base2.DOM.Document.querySelectorAll(...)
                    */
                    base2.DOM.Document.querySelectorAll(f,"*[class*=\""+wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX+variables[i]+"\"]").forEach(
                        function(variable){
                            if(!variable.addEventListener) {
                                base2.DOM.bind(variable);
                            }
                            // make sure the variable is an exact match.
                            var exactMatch = ((' ' + variable.className + ' ').indexOf(' '+wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX+variables[i]+' ')!=-1);
                            if(!exactMatch) return;

                            // listen for value changes
                            if(!wFORMS.behaviors.calculation.isHandled(variable)){
                                var t = variable.tagName.toLowerCase();
                                if (t == 'input' || t == 'textarea') {

                                    // toggled fields
                                    var y = variable.type.toLowerCase();
                                    if (t == 'input' && (y == 'radio' || y == 'checkbox')) {
                                        variable.addEventListener('click', function(e){ return b.run(e, this)}, false);
                                        wFORMS.behaviors.calculation.setHandledFlag(variable);

                                    // text entry fields
                                    } else {
                                        variable.addEventListener('blur', function(e){ return b.run(e, this)}, false);
                                        wFORMS.behaviors.calculation.setHandledFlag(variable);
                                    }

                                // select boxes
                                } else if (t == 'select') {
                                    variable.addEventListener('change',  function(e){ return b.run(e, this)}, false);
                                    wFORMS.behaviors.calculation.setHandledFlag(variable);

                                // unsupported elements
                                } else {
                                    return;
                                }
                            }

                            b.varFields.push({name: variables[i], field: variable});
                        }
                    );
                }
            }
            var calc = { field: elem, formula: formula, variables: b.varFields };
            b.calculations.push(calc);
            b.compute(calc);
        }
    );

    b.onApply();

    return b;
}

/**
 * Executed once the behavior has been applied to the document.
 * Can be overwritten.
 */
wFORMS.behaviors.calculation.instance.prototype.onApply = function() {}

/**
 * Runs when a field is changed, update dependent calculated fields.
 * @param {event} event
 * @param {domElement} elem
 */
wFORMS.behaviors.calculation.instance.prototype.run = function(event, element) {

    for(var i=0; i<this.calculations.length;i++) {
        var calc = this.calculations[i];
        for(var j=0; j<calc.variables.length;j++) {

            if(element==calc.variables[j].field) {
                // this element is part of the calculation for calc.field
                this.compute(calc);
            }
        }
    }
}

/**
 * Can be used to update a calculated field if the run method is not triggered.
 * @param {event} event
 * @param {domElement} elem
 */
wFORMS.behaviors.calculation.instance.prototype.refresh = function(event, element) {

    for(var i=0; i<this.calculations.length;i++) {
        var calc = this.calculations[i];

        if(element==calc.field) {
            this.compute(calc);
        }
    }
}

wFORMS.behaviors.calculation.instance.prototype.refreshAll = function() {
    for(var i=0; i<this.calculations.length;i++) {
        var calc = this.calculations[i];
        this.compute(calc);
    }
}

/**
 * @param {DomElement or String} The variable field, or the variable name.
 * @return {Array DomElement} the matching calculated elements.
 */
wFORMS.behaviors.calculation.instance.prototype.getCalculatedFields = function( variable ) {
    var foundFields = [];
    for(var i=0; i<this.calculations.length;i++) {
        var calc = this.calculations[i];
        for(var j=0; j<this.calculations[i].variables.length;j++) {
            if( (variable.nodeName && this.calculations[i].variables[j].field == variable) ||
                (typeof variable == 'string' && this.calculations[i].variables[j].name == variable) ) {
                foundFields.push( this.calculations[i].field );
            }
        }
    }
    return foundFields;
}


wFORMS.behaviors.calculation.instance.prototype.compute = function(calculation) {
    var f = this.target;
    var formula = calculation.formula;
    var _processedVariables = new Array();
    var isNumericCalculation = true;  // behavior is different when computing a calculation, or merely concatenating strings.

    for(var i=0; i<calculation.variables.length;i++) {
        var v = calculation.variables[i];
        var varval = isNumericCalculation?0:'';
        var _self  = this;

        // We don't rely on calculation.variables[i].field because
        // the form may have changed since we've applied the behavior
        // (repeat behavior for instance).

        // Since the calculations can have several variables with the same name
        // querySelectorAll will catch them all, so we don't need to also loop
        // through all of them.
        if(wFORMS.helpers.contains(_processedVariables,v.name)) {
            continue;
        } else {
            _processedVariables.push(v.name);
        }

        /*
        Binding with forEach sometime fails when using this, resulting in undefined 'variable' parameter.
            f.querySelectorAll("*[class*=\"...\"]");
        Library call works fine: base2.DOM.Document.querySelectorAll(...)
        */
        base2.DOM.Document.querySelectorAll(f,"*[class*=\""+_self.behavior.VARIABLE_SELECTOR_PREFIX+v.name+"\"]").forEach(
            function(variable){


                // make sure the variable is an exact match.
                var exactMatch = ((' ' + variable.className + ' ').indexOf(' '+wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX+v.name+' ')!=-1);
                if(!exactMatch) return;

                if(!_self.inScope(calculation.field, variable)){
                    return;
                }

                if(variable.disabled) {
                    return;
                }

                // If field value has a different purpose, the value for the calculation can be set in the
                // class attribute, prefixed with CHOICE_VALUE_SELECTOR_PREFIX
                if(_self.hasValueInClassName(variable)) {
                    var value = _self.getValueFromClassName(variable);
                } else {
                    value = wFORMS.helpers.getFieldValue(variable);
                }

                //need to test if value is string, because an empty string is regards as false
                if((typeof value !== 'string') && !value) value=0;
                if(value.constructor==Array) { // array (multiple select)

                    for(var j=0;j<value.length;j++) {

                        if(!wFORMS.helpers.isNumericValue(value[j]) && !wFORMS.helpers.isEmptyValue(value[j])) {
                            isNumericCalculation = false;
                        }

                        if(isNumericCalculation){
                            varval += wFORMS.helpers.getNumericValue(value[j]);
                        } else {
                            (!varval)?(varval=value[j]):(varval=String(varval).concat(value[j]));
                        }
                    }
                } else {

                    if(!wFORMS.helpers.isNumericValue(value) && !wFORMS.helpers.isEmptyValue(value)) {
                        isNumericCalculation = false;
                    }

                    if(isNumericCalculation){
                        varval += wFORMS.helpers.getNumericValue(value);
                    } else {
                        (!varval)?(varval=String(value)):(varval=String(varval).concat(value));
                    }
                }
            }
        );

        // prepend variable assignment to the formula
        if(isNumericCalculation) {
            formula = 'var '+ v.name +' = '+ varval +'; '+ formula;
        } else {
            formula = 'var '+ v.name +' = "'+ varval.replace(/\"/g, '\\"') +'"; '+ formula;
        }

    }

    try {
        var calc = function () {return eval(formula)};
        var result = calc();
        if(result == 'Infinity' || result == 'NaN' || String(result).match('NaN')){
            result = 'error';
        }
    } catch(x) {
        result = 'error';
    }
    // Check if validation behavior is available. Then flag field if error.
    var validationBehavior = wFORMS.getBehaviorInstance(this.target,'validation');
    if(validationBehavior) {
        // add validation error message
        if(!wFORMS.behaviors.validation.messages['calculation']) {
            wFORMS.behaviors.validation.messages['calculation'] = this.behavior.CALCULATION_ERROR_MESSAGE;
        }
        validationBehavior.removeErrorMessage(calculation.field);
        if(result=='error') {
            validationBehavior.fail(calculation.field, 'calculation');
        }
    }

    calculation.field.value = result;


    // If the calculated field is also a variable, recursively update dependant calculations
    if( this.isVariable(calculation.field) ) {
        // TODO: Check for infinite loops?
        this.run(null,calculation.field);
    }
}

wFORMS.behaviors.calculation.instance.prototype.isVariable = function(element) {
    return element.className && (element.className.indexOf(this.behavior.VARIABLE_SELECTOR_PREFIX)!=-1);
}

wFORMS.behaviors.calculation.instance.prototype.hasValueInClassName = function(element) {
    switch(element.tagName) {
        case "SELECT":
            for(var i=0;i<element.options.length;i++) {
                if(element.options[i].className && element.options[i].className.indexOf(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)!=-1) {
                    return true;
                }
            }
            return false;
            break;
        default:
            if(!element.className || (' '+element.className).indexOf(' '+this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)==-1)
                return false;
            break;
    }
    return true;
}
/**
 * getValueFromClassName
 * If field value has a different purpose, the value for the calculation can be set in the
 * class attribute, prefixed with CHOICE_VALUE_SELECTOR_PREFIX
 * @param {domElement} element
 * @returns {string} the value of the field, as set in the className
 */
wFORMS.behaviors.calculation.instance.prototype.getValueFromClassName = function(element) {
    switch(element.tagName) {
        case "INPUT":
            if(!element.className || element.className.indexOf(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)==-1)
                return null;

            var value = element.className.split(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)[1].split(' ')[0];
            if(element.type=='checkbox' || element.type=='radio')
                return element.checked?value: (wFORMS.helpers.isNumericValue(value) ? 0 : '' );
            return value;
            break;
        case "SELECT":
            if(element.selectedIndex==-1) {
                return null;
            }

            var v=[];
            for(var i=0;i<element.options.length;i++) {
                if(element.options[i].selected) {
                    if(element.options[i].className && element.options[i].className.indexOf(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)!=-1) {
                        var value = element.options[i].className.split(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)[1].split(' ')[0];
                        v.push(value);
                    }
                }
            }
            if(v.length==0) return null;
            return v;

            break;
        case "TEXTAREA":
            if(!element.className || element.className.indexOf(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)==-1)
                return null;
            var value = element.className.split(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)[1].split(' ')[0];

            return value;
            break;
        default:
            return null;
            break;
    }
    return null;
}


/**
 * Checks if element is already handled
 * @param   {HTMLElement}   elem
 * @return  boolean
 */
wFORMS.behaviors['calculation'].isHandled = function(elem){
    return (elem._wforms_calc_handled === true);
}

/**
 * set element as already handled
 * @param   {HTMLElement}   elem
 * @return  boolean
 */
wFORMS.behaviors['calculation'].setHandledFlag = function(elem){
    elem._wforms_calc_handled = true;
}

/**
 * Removes handle attribute from element
 * @param   {HTMLElement}   elem
 * @return  boolean
 */
wFORMS.behaviors['calculation'].removeHandledFlag = function(elem){
    try {
        delete elem._wforms_calc_handled;
    } catch(e) {
        elem._wforms_calc_handled = undefined; // Workaround  for <IE8
    }
}

/**
 * Limit scope of calculation variables when used inside repeated sections.
 * @param  {DOMElement} calculatedElement The element whose value is being calcuted.
 * @param  {DOMElement} variableElement   The element whose value is a variable in the calculation.
 * @return {Boolean}    True if the variable should be used in the calculation. False otherwise (out of scope)
 */
 wFORMS.behaviors.calculation.instance.prototype.inScope = function(calculatedElement, variableElement) {

        // Check that repeat behavior is present.
        if(wFORMS.behaviors.repeat) {

            // Prepare 2 sets, one for the scope of the calculated field, and one for the scope of the variable field.
            var calculatedRepeatSet = [];
            var variableRepeatSet   = [];

            // Populate the set for the calculated field. We add all repeatable elements that are parent in the DOM.
            var repeatElement = wFORMS.behaviors.repeat.getRepeatedElement( calculatedElement );
            while(repeatElement) {
                calculatedRepeatSet.push( repeatElement );
                repeatElement = wFORMS.behaviors.repeat.getRepeatedElement( repeatElement.parentNode );
            }

            // Populate the set for the variable field in a similar fashion.
            repeatElement = wFORMS.behaviors.repeat.getRepeatedElement( variableElement );
            while(repeatElement) {
                variableRepeatSet.push( repeatElement );
                repeatElement = wFORMS.behaviors.repeat.getRepeatedElement( repeatElement.parentNode );
            }

            // Helper function to check if one set is a subset of the other (i.e. all members are included in the superset)
            var isSubset = function(subset, superset) {
                for(var i=0;i<subset.length;i++) {
                    for(var j=0;j<superset.length;j++) {
                        if(subset[i] === superset[j]) {
                            break;
                        }
                    }
                    if(j==superset.length) {
                        return false;
                    }
                }
                return true;
            };

            // The variable is in scope as long as one of the two sets is a subset of the other.
            // Works also if any of the set is empty (variable or calculated field not in a repeated section)
            return isSubset(calculatedRepeatSet, variableRepeatSet) || isSubset(variableRepeatSet, calculatedRepeatSet);
        }

        // No repeated behavior, so variable is always in scope.
        return true;
    }
