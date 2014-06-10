
if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}
/**
 * wForms calculation behavior.
 */
wFORMS.behaviors.calculation  = {

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
        this.variables = {};

        // handle case where repeated sections are removed.
        if(wFORMS.behaviors.repeat) {
            var self = this;
            wFORMS.behaviors.repeat.observeRemoveComplete( function(elem){self.unApply(elem);} );
        }
    }
}

/**
 * Applies the behavior to the given HTML element by setting the appropriate event handlers and populating
 * the internal data structures.
 * @param {domElement}  f An HTML element, either nested inside a FORM element or the FORM element itself.
 * @return {object}     an instance of the behavior
 */
wFORMS.behaviors.calculation.applyTo = function(element) {

    // Get to the <form> element.
    var f = element;
    while(f && f.tagName!='FORM') {
        f = f.parentNode;
    }
    if(!f) {
        return; // no form found, nothing to do.
    }

    // retrieve the existing instance for this form, if it already exists.
    var b = wFORMS.getBehaviorInstance(f,'calculation');
    if(!b) {
        // otherwise, create it.
        b = new wFORMS.behaviors.calculation.instance(f);
        var isNewInstance = true;
    } else {
        var isNewInstance = false;
    }

    var mustRecompute = [];

    // look for elements with calculations
    base2.DOM.Element.querySelectorAll(element,wFORMS.behaviors.calculation.CALCULATION_SELECTOR).forEach(

        function(elem){

            // extract formula (TODO: Handle data- attribute.)
            var formula = elem.className.substr(elem.className.indexOf('formula=')+8).split(' ')[0];

            // get the list of variables in this calculations.
            var variables = formula.split(/[^a-zA-Z]+/g);

            var calc = { field: elem, formula: formula, variables: variables };

            if( !b.isInCalculationTable( calc ) ) {
                b.calculations.push(calc);
            }
            if( !b.isInCalculationTable( calc, mustRecompute ) ) {
                mustRecompute.push(calc);
            }
        }
    );

    // look for elements that are variable in calculations
    base2.DOM.Document.querySelectorAll(element,"*[class*=\""+wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX+"\"]").forEach(
        function(variableElement){

            if(!wFORMS.behaviors.calculation.isValidVariableElement(variableElement)) {
                return;
            }

            // get variable name
            var variable = wFORMS.behaviors.calculation.getVariableName(variableElement);

            if(!variable) {
                return;
            }

            // populate hash table linking variable names to form fields (DOM elements)
            // a variable may have more than one field associated to it.
            if(!b.variables[variable]) {
                b.variables[variable] = [ variableElement ];
            } else {
                if(b.variables[variable].indexOf(variableElement)==-1) {
                    b.variables[variable].push( variableElement );
                }
            }

            // Any calculation using this new found variable must be recomputed.
            var calculations = b.findCalculationsByVariable(variable);

            if( !b.isInCalculationTable( calculations, mustRecompute ) ) {
                mustRecompute = mustRecompute.concat(calculations);
            }

            // listen for value changes
            if(!variableElement.addEventListener) {
                base2.DOM.bind(variableElement);
            }
            if(!wFORMS.behaviors.calculation.isHandled(variableElement)){
                var t = variableElement.tagName.toLowerCase();
                if (t == 'input' || t == 'textarea') {

                    // toggled fields
                    var y = variableElement.type.toLowerCase();
                    if (t == 'input' && (y == 'radio' || y == 'checkbox')) {
                        variableElement.addEventListener('click', function(e){ return b.run(e, this)}, false);
                        wFORMS.behaviors.calculation.setHandledFlag(variableElement);

                    // text entry fields
                    } else {
                        variableElement.addEventListener('blur', function(e){ return b.run(e, this)}, false);
                        wFORMS.behaviors.calculation.setHandledFlag(variableElement);
                    }

                // select boxes
                } else if (t == 'select') {
                    variableElement.addEventListener('change',  function(e){ return b.run(e, this)}, false);
                    wFORMS.behaviors.calculation.setHandledFlag(variableElement);
                }
            }
        }
    );

    for(var i=0;i<mustRecompute.length;i++) {
        b.compute(mustRecompute[i]);
    }
    b.onApply();

    if(isNewInstance) {
        return b;
    } else {
        return [];
    }
}


wFORMS.behaviors.calculation.instance.prototype.unApply = function(element) {

    // Get to the <form> element.
    var f = this.target;
    var b = this;

    var mustRecompute = [];

     // look for elements with calculations
    base2.DOM.Element.querySelectorAll(element,wFORMS.behaviors.calculation.CALCULATION_SELECTOR).forEach(

        function(elem){

            for(var i=0;i<b.calculations.length;i++) {
                if(b.calculations[i].field == elem) {
                    if( b.isVariable(elem) ) {
                        // todo, ensure each element is only once in the array.
                        mustRecompute = mustRecompute.concat(b.getCalculatedFields(elem));
                    }
                    b.calculations.splice(i,1);
                    break;
                }
            }
        }
    );

     // look for elements that are variable in calculations
    base2.DOM.Document.querySelectorAll(element,"*[class*=\""+wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX+"\"]").forEach(
        function(variableElement){

            var variable = wFORMS.behaviors.calculation.getVariableName(variableElement);
            for(var i=0;i<b.variables[variable].length;i++) {
                if(b.variables[variable][i]==variableElement) {
                    mustRecompute = mustRecompute.concat(b.getCalculatedFields(variableElement));
                    b.variables[variable].splice(i,1);
                    return;
                }
            }
        }
    );

    for(var i=0;i<mustRecompute.length;i++) {
        b.refresh(null,mustRecompute[i]);
    }
}

wFORMS.behaviors.calculation.isValidVariableElement = function(element) {
    return (element && (element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA'));
}

wFORMS.behaviors.calculation.getVariableName = function(element) {
    var classes = element.className;
    var variableClass = classes.substr(classes.indexOf(wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX)).split(' ')[0];
    variableClass = variableClass.replace(wFORMS.behaviors.calculation.VARIABLE_SELECTOR_PREFIX,'');
    return variableClass;
}

wFORMS.behaviors.calculation.instance.prototype.isInCalculationTable = function( calculation, calculationTable) {

    if(!calculationTable) {
        calculationTable = this.calculations;
    }

    if(calculation.constructor==Array) {
        for(var i=0;i<calculation.length;i++) {
            if(this.isInCalculationTable(calculation[i], calculationTable)) {
                return true;
            }
        }
    } else {
        for(var i=0;i<calculationTable.length; i++) {
            if(calculationTable[i].field == calculation.field) {
                return true;
            }
        }
    }
    return false;
}

wFORMS.behaviors.calculation.instance.prototype.findCalculationsByVariable = function (variable) {
    var matchingCalculations = [];
    for(var i=0;i<this.calculations.length; i++) {
        for(var j=0;j<this.calculations[i].variables.length;j++) {
            if(this.calculations[i].variables[j] == variable) {
                matchingCalculations.push( this.calculations[i] );
            }
        }
    }
    return matchingCalculations;
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
    var variable = wFORMS.behaviors.calculation.getVariableName(element);
    var calculations = this.findCalculationsByVariable( variable );
    for(var i=0; i<calculations.length;i++) {
        this.compute(calculations[i]);
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
wFORMS.behaviors.calculation.instance.prototype.getCalculatedFields = function( element ) {
    var variable = wFORMS.behaviors.calculation.getVariableName(element);
    var calculations = this.findCalculationsByVariable( variable );
    var foundFields = [];
    for(var i=0;i<calculations.length;i++) {
        foundFields.push(calculations[i].field);
    }
    return foundFields;
}


wFORMS.behaviors.calculation.instance.prototype.compute = function(calculation) {

    var f = this.target;
    var formula = calculation.formula;
    var isNumericCalculation = true;  // behavior is different when computing a calculation, or merely concatenating strings.

    for(var i=0; i<calculation.variables.length;i++) {
        var variable = calculation.variables[i];
        var varval   = isNumericCalculation?0:'';

        if(!variable || !this.variables[variable]) {
            continue;
        }
        for(var j=0;j<this.variables[variable].length;j++) {

            var variableElement = this.variables[variable][j];

            if(variableElement.disabled) {
                continue;
            }

            if(!this.inScope(calculation.field, variableElement)){
                continue;
            }

            // If field value has a different purpose, the value for the calculation can be set in the
            // class attribute, prefixed with CHOICE_VALUE_SELECTOR_PREFIX
            if(this.hasValueInClassName(variableElement)) {
                var value = this.getValueFromClassName(variableElement);
            } else {
                value = wFORMS.helpers.getFieldValue(variableElement);
            }

            //need to test if value is string, because an empty string is regarded as false
            if((typeof value !== 'string') && !value) value=0;
            if(value.constructor==Array) { // array (multiple select)

                for(var k=0;k<value.length;k++) {

                    if(!wFORMS.helpers.isNumericValue(value[k]) && !wFORMS.helpers.isEmptyValue(value[k])) {
                        isNumericCalculation = false;
                    }

                    if(isNumericCalculation){
                        varval += wFORMS.helpers.getNumericValue(value[k]);
                    } else {
                        (!varval)?(varval=value[k]):(varval=String(varval).concat(value[k]));
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


        // prepend variable assignment to the formula
        if(isNumericCalculation) {
            formula = 'var '+ variable +' = '+ varval +'; '+ formula;
        } else {
            formula = 'var '+ variable +' = "'+ varval.replace(/\"/g, '\\"') +'"; '+ formula;
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

    if(result!=calculation.field.value) {

        calculation.field.value = result;

        // If the calculated field is also a variable, recursively update dependant calculations
        if( this.isVariable(calculation.field) ) {
            // TODO: Check for infinite loops?
            this.run(null,calculation.field);
        }
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
            if (element.multiple) {
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
            }
            if (element.options[element.selectedIndex].className &&  element.options[element.selectedIndex].className.indexOf(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)!=-1) {
                var value =  element.options[element.selectedIndex].className.split(this.behavior.CHOICE_VALUE_SELECTOR_PREFIX)[1].split(' ')[0];
                return value;
            }
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
