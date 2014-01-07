if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}

wFORMS.behaviors['condition'] = (function(){
    'use strict';

    //Constant
    var DELIMITER = '`';
    var CONDITIONAL_ATTRIBUTE_NAME = 'data-condition';
    var TRIGGER_CONDITIONALS = 'data-conditionals';
    var TRIGGER_DEFAULT_ENABLED = true;
    var DEFAULT_NON_EXIST_TRIGGER_VALUE = false;



    /**
     * Rename the references to the triggers in conditionals, when a trigger changed its name
     * @param masterRenameTable
     * @param referenceConditionalClones
     * @param involvedConditionals
     * @private
     */
    function _renameTriggers(masterRenameTable, referenceConditionalClones, involvedConditionals){
        involvedConditionals = involvedConditionals || [];
        var renamedTriggers = reduce(masterRenameTable, function(renamed, original, sum){
            if( !(new Trigger(renamed)).isValid() ){
                return sum;
            }
            sum[original] = renamed;
            return sum;
        }, {});
        var renamedConditionals = reduce(masterRenameTable, function(renamed, original, sum){
            if( !(new Conditional(renamed)).isValid() ){
                return sum;
            }
            sum[original] = renamed;
            return sum;
        }, {});

        map(renamedTriggers, function(newName, original){
            var trigger = new Trigger(newName);
            var conditionals = trigger.getConditionals();
            map(conditionals, function(conditional){
                //if the conditional is also renamed, get its new name, or otherwise use the current name.
                var currentConditionalName = renamedConditionals[conditional.getIdentifier()]
                    || conditional.getIdentifier();

                var conditionalsToChange = [currentConditionalName];

                //Does this conditional has a clone? if it does, also update its clone.
                if(referenceConditionalClones[currentConditionalName]){
                    conditionalsToChange.push(referenceConditionalClones[currentConditionalName]);
                }
                map(conditionalsToChange, function(identifier){
                    conditional = new Conditional(identifier);
                    if(!conditional.isValid()){
                        return;
                    }
                    conditional.unlinkTriggers();
                    conditional.replaceTrigger(original, newName);
                    involvedConditionals.push(identifier);
                    conditional.linkTriggers();
                });
            });
        })
    }

    /**
     * Rename the conditional references in the triggers, so the triggers can still link to the conditionals, when the
     * conditionals are renamed.
     * @private
     */
    function _renameConditionals(idMappings, involvedConditionals){
        var repeat = idMappings.repeat;
        var renamedConditionals = reduce(repeat, function(renamed, original, sum){
            if( !(new Conditional(renamed)).isValid() ){
                return sum;
            }
            sum[original] = renamed;
            return sum;
        }, {});

        var conditionals = map(renamedConditionals, function(newClone, oldName){
            return newClone;
        });
        if(!isObjectEmpty(idMappings.master)){
            //if this is not the first time a master node is repeated, also regard those conditionals in the master node
            conditionals = conditionals.concat(map(renamedConditionals, function(newClone, oldName){
                return oldName;
            }));
        }
        map(conditionals, function(identifier){
            var conditional = new Conditional(identifier);
            conditional.unlinkTriggers();
            conditional.linkTriggers();
            involvedConditionals.push(identifier);
        })
    }

    /**
     * Try to modify the condition rule on the conditionals, so the conditionals in the duplicated section will get its
     * triggers redirected to the ones that are in the same duplicated section; the conditionals outside of the
     * duplicated section will regard the duplicated trigger along with the original trigger together by forming a
     * compound trigger expression.
     *
     * @param repeatMapping
     * @param masterNode
     * @param duplicateNode
     * @param involvedConditionals
     * @private
     */
    function _consolidateTriggers(repeatMapping, masterNode, duplicateNode, involvedConditionals){
        involvedConditionals = involvedConditionals || [];
        //find mappings of triggers to their clones
        var clonedTriggers = reduce(repeatMapping, function(cloneName, original, sum){
            if( !(new Trigger(original)).isValid() ){
                return sum;
            }
            sum[original] = cloneName;
            return sum;
        }, {});

        map(clonedTriggers, function(cloneName, original){
            var trigger = new Trigger(original);
            var conditionals = trigger.getConditionals();

            map(conditionals, function(conditional){
                if(!conditional.isValid()){
                    return;
                }
                var conditionalElement = conditional.getConditionalElement();
                if(!conditionalElement){
                    return;
                }
                if( isDescendantOf(conditionalElement, masterNode ) ){ // the conditional is in master node, keep
                    return;
                }
                var replacement;
                if( isDescendantOf(conditionalElement, duplicateNode)){
                    //Case 1: inside repeatable
                    replacement = cloneName;
                }else{
                    //Case 2: outside repeatable
                    replacement = {'OR' : [original, cloneName]}; //ATTENTION!!! 'OR' is hard coded here.
                }
                conditional.unlinkTriggers();
                conditional.replaceTrigger(original, replacement );
                conditional.linkTriggers();
                involvedConditionals.push(conditional.getIdentifier()); // remember this conditional, will update it later
            });
        });
    }

    /**
     * When a repeatable section is removed, detach the conditionals inside it form their associated triggers
     * @param removedNode the removed DOM node which is already detached form document.
     * @private
     */
    function _detachConditionals(removedNode){
        var conditionalDOMs = base2.DOM.Element.querySelectorAll(removedNode, '['+ CONDITIONAL_ATTRIBUTE_NAME +']');
        var conditionals = [];
        conditionalDOMs.forEach(function(conditionalDOM){
            conditionals.push(new Conditional(conditionalDOM, removedNode));
        });

        map(conditionals, function(conditional){
            conditional.unlinkTriggers();
        });
    }

    /**
     * When a repeatable section is removed, detach the triggers inside it form their associated conditionals
     * @param removedNode the removed DOM node which is already detached form document.
     * @private
     */
    function _detachTriggers(removedNode){
        var triggerDOMs = base2.DOM.Element.querySelectorAll(removedNode, '['+ TRIGGER_CONDITIONALS +']');
        var triggers = [];
        triggerDOMs.forEach(function(triggerDOM){
            triggers.push(new Trigger(triggerDOM, removedNode));
        });

        map(triggers, function(trigger){
            var conditionals = trigger.getConditionals();

            map(conditionals, function(conditional){
                if(!conditional.isValid()){ // if the conditional is not valid, it might have been removed
                    return;
                }
                var conditionalElement = conditional.getConditionalElement();
                if(!isDescendantOf(conditionalElement, removedNode)){
                    // if this trigger links to a conditional outside of removedNode, detach this trigger from that
                    // conditional
                    conditional.detach(trigger.getIdentifier());
                }
            });
        });
    }

    /**
     * Convert id strings in the idMappings to css selectors (prepend '#' to them)
     * @param idMappings
     * @return {*}
     * @private
     */
    function _preprocessParameter(idMappings){
        function _replace(renamed, original, sum){
            sum[_escapeQuerySelector('#' + original)] = _escapeQuerySelector('#' + renamed);
            return sum;
        }
        idMappings.master = reduce(idMappings.master, _replace, {});
        idMappings.repeat = reduce(idMappings.repeat, _replace, {});
        return idMappings;
    }

    /**
     * Sometimes the id selector might have element[0][1] style, however [*] has already had semantics in css selector,
     * have to escape them.
     * @param selector
     * @return {*}
     * @private
     */
    function _escapeQuerySelector(selector){
        if( !selector || selector === ''){
            return null;
        }
        return selector.replace(/\[(\d+)\]/g, function($, $1){
            return '\\[' + $1 + '\\]';
        });
    }


    //helper functions
    function map(enumerable, callback){
        if(!enumerable){
            return null;
        }
        var result = [];
        if(enumerable instanceof Array){
            for(var i = 0, l = enumerable.length; i < l; i++){
                result.push(callback(enumerable[i], i));
            }
        }else if(typeof enumerable === 'object'){
            for(var key in enumerable){
                if(typeof key === 'undefined'){
                    continue;
                }
                result.push(callback(enumerable[key], key));
            }
        }else{
            return null;
        }
        return result;
    }

    function filter(enumerable, callback){
        var result = [];
        map(enumerable, function(element){
            if(callback.apply(null, arguments)){
                result.push(element);
            }
        });
        return result;
    }

    function extend(){
        var extendee = arguments[0];
        for(var i = 1; i < arguments.length; i++){
            var attributes = arguments[i];
            for(var key in attributes){
                extendee[key] = attributes[key];
            }
        }
        return extendee;
    }

    function trim(str){
        return str.replace(/(^\s+)|(\s+$)/g, '');
    }

    function reduce(enumerable, callback, sum){
        sum = sum || {};
        map(enumerable, function(value, key){
            sum = callback.call(window, value, key, sum);
        });
        return sum;
    }

    function removeDuplicates(enumerable){
        var  hash = {};
        var result = [];
        map(enumerable, function(value){
            if(!hash[value]){
                result.push(value);
                hash[value] = 1;
            }
        });
        return result;
    }

    function getOrAssignID(domElement){
        if( !isHTMLElement(domElement)){
            throw new Error('not a dom element');
        }
        var id;
        return domElement.getAttribute('id') || (id = wFORMS.helpers.randomId() &&
            (domElement.setAttribute('id', id) || id))
    }

    function isDescendantOf(child, parent){
        while(child){
            if( child.parentNode === parent){
                return true;
            }
            child = child.parentNode;
        }
        return false;
    }

    function isObjectEmpty(object){
        return (filter(object, function(){return true})).length === 0;
    }

    var inArray = wFORMS.helpers.contains;
    var isHTMLElement = wFORMS.helpers.isHTMLElement;

    //classes
    var Conditional = (function(){
        /**
         * @param domElementIdentifier string or DOM element
         * @param referenceDOMTree by default this should be document, however may not exist in document, this can
         * happen when the section the trigger is in is detached.
         * @constructor
         */
        function Conditional(domElementIdentifier, referenceDOMTree){

            this._conditionalDomIdentifier = domElementIdentifier;
            if(typeof domElementIdentifier !== 'string'){
                var domElement = domElementIdentifier;
                this._conditionalDomIdentifier = '#' + getOrAssignID(domElement);

                if(!isHTMLElement(domElement) || !domElement.hasAttribute(CONDITIONAL_ATTRIBUTE_NAME)){
                    throw new Error( 'this element doesn\'t have a "'+CONDITIONAL_ATTRIBUTE_NAME+'" attribute');
                }
            }

            this._conditionalDomIdentifier = _escapeQuerySelector(this._conditionalDomIdentifier);
            this.referenceDOMTree = referenceDOMTree || document;
        }

        function PolishExpression(operator, operands){
            this.operator = (operator + '').toUpperCase();
            this.operands = operands;
        }
        extend(PolishExpression.prototype, {
            // see: http://stackoverflow.com/questions/9466156/tostring-does-not-work-in-ie
            toStringy: function(){
                var components = map(this.operands, function(operand){
                    if(operand instanceof PolishExpression){
                        return operand.toStringy();
                    }
                    return ' ' + operand + ' ';
                });

                if(this.operator === 'NOT'){
                    var component = this.operands[0];
                    if(component instanceof PolishExpression){
                        return ' ( NOT' + components[0] + ') '
                    }
                    return ' ( NOT (' + components[0] + ') ) '
                }

                if(components.length > 1){
                    return ' (' + components.join(this.operator) + ') ';
                }
                return components[0];
            }
        });

        //private functions
//        var COMPONENT_PATTERN = new RegExp(DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER, 'g');
        var COMPONENT_PATTERN = new RegExp(' ?' + DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER + ' ?', 'g');
        var COMPOUND_COMPONENT_PATTERN = new RegExp('((AND)|(OR))\\s*' + DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER, 'g');
        var BRACKETED_SINGLE_TRIGGER_PATTERN
            = new RegExp('\\(\\s*' + DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER + '\\s*\\)', 'g');

        /**
         * filter those detached triggers, leave only valid triggers
         * @param instance Conditional
         * @private
         */
        function _getActiveTriggers(instance){
            var triggers = instance.getTriggers();
            return filter(triggers, function(trigger){
                return trigger.getTriggerElement() !== null;
            });
        }


        /**
         * A conditional rule is implicitely affected by any other conditional rule set on a parent element. If the parent is off/disabled,
         * the rule cannot be activated. To handle this, we automatically rebuild the conditional rule during execution
         * by adding the parent rule in a 'AND' condition.
         *
         * @param  {[type]} conditional [description]
         * @return {[type]}             [description]
         * @private
         */
        function _mergeImplicitRules() {

            var rule          = this.getConditionRuleString();
            var replaceRule   = false;
            var domElement    = this.getConditionalElement();
            var parentElement = domElement.parentNode;

            while(parentElement && parentElement.nodeType==1) {
                var parentRule = parentElement.getAttribute(CONDITIONAL_ATTRIBUTE_NAME);

                if(parentRule && rule.indexOf(parentRule)===-1) {
                    rule = "("+ rule +") AND (" + parentRule + ")";
                    replaceRule = true;
                }
                parentElement = parentElement.parentNode;
            }

            if(replaceRule) {
                this.unlinkTriggers();
                domElement.setAttribute(CONDITIONAL_ATTRIBUTE_NAME, rule);
                this.linkTriggers();
            }
        }

        //public functions
        extend(Conditional.prototype, {
            getConditionRuleString: function(){
                var domElement = this.getConditionalElement();
                if(!domElement){
                    return null;
                }
                return domElement.getAttribute(CONDITIONAL_ATTRIBUTE_NAME)
            },

            getTriggers: function(){
                var conditionRuleString = this.getConditionRuleString();
                if(!conditionRuleString ){
                    return null;
                }

                var triggerIdentifiers = [], match;
                COMPONENT_PATTERN.lastIndex = 0; //reset regex

                while(match = COMPONENT_PATTERN.exec( conditionRuleString )){
                    triggerIdentifiers.push(match[1]);
                }

                return map(triggerIdentifiers, function(identifier){
                    var e;
                    try{
                        return new Trigger(identifier);
                    }catch(e){
                        return null;
                    }
                })
            },

            getConditionalElement: function(){
                try{
                    return base2.DOM.Element.querySelector(this.referenceDOMTree, this._conditionalDomIdentifier)
                }catch(e){
                    return null;
                }
            },

            getIdentifier: function(){
                return this._conditionalDomIdentifier;
            },

            /**
             * Test if this conditional instance equals to another one
             * @param conditional
             */
            equals : function(conditional){
                if(this.getIdentifier() === conditional.getIdentifier()){
                    return true; // if the identifiers equal, then two conditional do as well.
                }

                var domElementOne = this.getConditionalElement();
                var domElementAnother = conditional.getConditionalElement();

                if(!domElementAnother || !domElementOne ){
                    return false; // if either of the elements doesn't exist, then not equal
                }
                return domElementAnother === domElementOne;
            },

            linkTriggers: function(){
                map(_getActiveTriggers(this), function(conditional){
                    return function(trigger){
                        trigger.addConditional(conditional);
                    }
                }(this));
            },

            unlinkTriggers: function(){
                map(_getActiveTriggers(this), function(conditional){
                    return function(trigger){
                        trigger.removeConditional(conditional);
                    }
                }(this));
            },

            refresh: function(){
                if(this.isConditionMet()){
                    this.show();
                }else{
                    this.hide();
                }
                var b = wFORMS.getBehaviorInstance( wFORMS.helpers.getForm( this.getConditionalElement() ), 'paging');
                if(b){
                    b.setupManagedControls();
                }
            },

            isConditionMet: function(){

                _mergeImplicitRules.call(this);

                var conditionRuleString = this.getConditionRuleString();
                if(!conditionRuleString ){
                    //doesn't have a rule string, cannot judge
                    throw new Error("The inferred DOM element doesn't have a rule string");
                }
                COMPONENT_PATTERN.lastIndex = 0; //reset regex

                var rawBooleanExpression = conditionRuleString.replace(COMPONENT_PATTERN, function($, $sub){
                    var trigger = new Trigger($sub);
                    return trigger.getValue() ? 'true' : 'false';
                });

                var booleanExpression = rawBooleanExpression.replace(/AND/g, ' && ').replace(/OR/g, ' || ')
                    .replace(/NOT/g, ' ! ');

                return eval(booleanExpression);
            },

            show: function(){
                var n  = this.getConditionalElement();
                var id = n.id;

                // get a handle on the calculation behavior instance so we can refresh calculations as we show/hide fields.
                var calculations = wFORMS.getBehaviorInstance( wFORMS.helpers.getForm(n),"calculation");


                if(n.tagName=='INPUT' || n.tagName=='SELECT' || n.tagName=='TEXTAREA' || base2.DOM.HTMLElement.hasClass(n,'choices')) {
                  // Get the DIV that wraps the input, its label and other related markup.
                  var p = n.parentNode;
                  while(p && p.nodeType==1 && !base2.DOM.HTMLElement.hasClass(p,'oneField')) {
                    p = p.parentNode;
                  }
                  if(p && p.nodeType==1 && base2.DOM.HTMLElement.hasClass(p,'oneField')) {
                    n=p;
                  } else {
                    // not nested in a .oneField div. Happens for hidden fields.
                    if(n.tagName=='INPUT') {
                        if(n._wforms_disabled) n.disabled = false;
                        if(n.getAttribute(TRIGGER_CONDITIONALS)) {
                            (new Trigger( n )).trigger();
                        }
                        // update calculations if any.
                        if(calculations) {
                            calculations.run(null, n);
                        }
                    }
                  }
                } else {
                    if(base2.DOM.HTMLElement.hasClass(n,'pageSection')) {
                        // Get the DIV that wraps the page section (with class wfPage or wfCurrentPage)
                        n = n.parentNode;
                    }
                }

                var _traverse = function(element) {
                    switch(element.tagName) {
                        case 'INPUT':
                            if(element._wforms_disabled) element.disabled = false;
                            if(element.getAttribute(TRIGGER_CONDITIONALS)) {
                                (new Trigger( element )).trigger();
                            }
                            // update calculations if any.
                            if(calculations) {
                                calculations.run(null, element);
                            }
                            break;
                        case 'TEXTAREA':
                            if(element._wforms_disabled) element.disabled = false;
                            // update calculations if any.
                            if(calculations) {
                                calculations.run(null, element);
                            }
                            break;
                        case 'SELECT':
                            if(element._wforms_disabled) element.disabled = false;
                            // For SELECT elements, the triggers are set on individual option tags.
                            var opts = element.getElementsByTagName('OPTION');
                            for(var j=0;j<opts.length;j++) {
                                if(opts[j].getAttribute(TRIGGER_CONDITIONALS)) {
                                    (new Trigger( opts[j] )).trigger();
                                }
                            }
                            // update calculations if any.
                            if(calculations) {
                                calculations.run(null, element);
                            }
                            break;
                        default:
                            for(var i=0;i<element.childNodes.length;i++) {
                                if( element.childNodes[i].nodeType==1 &&
                                   !wFORMS.behaviors.condition.hasOffState( element.childNodes[i] ) ) {

                                    _traverse(element.childNodes[i]);
                                }
                            }
                            break;
                    }
                }
                _traverse(n);

                var s = document.getElementById('tfa_switchedoff');
                if(s) {
                  if(s.value) {
                    var v = s.value.split(',');
                  } else {
                    var v = [];
                  }
                  for(var i in v){
                    if(v[i]==id){
                      v.splice(i,1);
                      s.value = v.join(',');
                      break;
                    }
                  }
                }

                base2.DOM.HTMLElement.removeClass(n,'offstate');
            },

            hide: function(){
                var n = this.getConditionalElement();
                var id = n.id;

                // get a handle on the calculation behavior instance so we can refresh calculations as we show/hide fields.
                var calculations = wFORMS.getBehaviorInstance( wFORMS.helpers.getForm(n),"calculation");


                if(n.tagName=='INPUT' || n.tagName=='SELECT' || n.tagName=='TEXTAREA' || base2.DOM.HTMLElement.hasClass(n,'choices')) {

                    // Get the DIV that wraps the input, its label and other related markup.
                    var p = n.parentNode;
                    while(p && p.nodeType==1 && !base2.DOM.HTMLElement.hasClass(p,'oneField')) {
                        p = p.parentNode;
                    }
                    if(p && p.nodeType==1 && base2.DOM.HTMLElement.hasClass(p,'oneField')) {
                        n=p;
                    } else {
                        // not nested in a .oneField div. Happens for hidden fields.
                        if(n.tagName=='INPUT') {
                            n.disabled = true;
                            n._wforms_disabled = true;
                            if(n.getAttribute(TRIGGER_CONDITIONALS)) {
                                (new Trigger(n)).trigger();
                            }
                            // update calculations if any.
                            if(calculations) {
                                calculations.run(null, n);
                            }
                        }
                    }
                } else {

                    if(base2.DOM.HTMLElement.hasClass(n,'pageSection')) {
                        // Get the DIV that wraps the page section (with class wfPage or wfCurrentPage)
                        n = n.parentNode;
                    }
                }
                var disabledList = [];

                var flds = n.getElementsByTagName('INPUT');
                for(var i=0;i<flds.length;i++) {

                    flds[i].disabled = true;
                    flds[i]._wforms_disabled = true;
                    disabledList.push(flds[i]);
                    if(flds[i].getAttribute(TRIGGER_CONDITIONALS)) {
                    (new Trigger(flds[i])).trigger();
                    }
                }

                var flds = n.getElementsByTagName('TEXTAREA');
                for(var i=0;i<flds.length;i++) {

                    flds[i].disabled = true;
                    flds[i]._wforms_disabled = true;
                    disabledList.push(flds[i]);
                }

                var flds = n.getElementsByTagName('SELECT');
                for(var i=0;i<flds.length;i++) {

                    flds[i].disabled = true;
                    flds[i]._wforms_disabled = true;
                    disabledList.push(flds[i]);
                    // For SELECT elements, the triggers are set on individual option tags.
                    var opts = flds[i].getElementsByTagName('OPTION');
                    for(var j=0;j<opts.length;j++) {
                      if(opts[j].getAttribute(TRIGGER_CONDITIONALS)) {
                        (new Trigger(opts[j])).trigger();
                      }
                    }
                }

                // update calculations if any
                for(var i=0;i<disabledList.length;i++) {
                    if(calculations) {
                        calculations.run(null, disabledList[i]);
                    }
                }

                var s = document.getElementById('tfa_switchedoff');
                if(s) {
                  if(s.value) {
                    var v = s.value.split(',');
                  } else {
                    var v = [];
                  }

                  for(var i in v){
                    if(v[i]==id){
                      v.splice(i,1);
                      break;
                    }
                  }
                  v.push(id);
                  s.value = v.join(',');
                }

                base2.DOM.HTMLElement.addClass(n,'offstate');
            },

            isValid : function(){
                return this.getConditionalElement() && this.getConditionRuleString();
            },

            /**
             * replace a trigger in the condition rule to another trigger or compound trigger expression.
             * @param oldTrigger
             * @param replacement can be a single selector or compound object
             */
            replaceTrigger : function(oldTrigger, replacement){
                if(typeof replacement === 'string'){
                    //then convert a single selector to relationship object
                    replacement = {'AND' : replacement}; //here setting the operator to AND or OR doesn't matter
                    //then later it will become `replacement`
                }

                replacement = Conditional.makeConditionRules(replacement);

                var conditionRuleString = this.getConditionRuleString();
                if(!conditionRuleString ){
                    //doesn't have a rule string, cannot judge
                    throw new Error("The inferred DOM element doesn't have a rule string");
                }

                COMPONENT_PATTERN.lastIndex = 0; //reset regex
                conditionRuleString = conditionRuleString.replace(COMPONENT_PATTERN, function($, $sub){
                    if($sub === oldTrigger){
                        return replacement;
                    }
                    return $;
                });
                (this.getConditionalElement()).setAttribute(CONDITIONAL_ATTRIBUTE_NAME, conditionRuleString);
            },

            /**
             * Detach a trigger from the conditional rule
             * @param trigger
             */
            detach: function(trigger){
                var conditionRuleString = this.getConditionRuleString();
                if(!conditionRuleString ){
                    //doesn't have a rule string, cannot proceed
                    throw new Error("The inferred DOM element doesn't have a rule string");
                }
                COMPOUND_COMPONENT_PATTERN.lastIndex = 0;
                conditionRuleString = conditionRuleString.replace(COMPOUND_COMPONENT_PATTERN, function($){
                    var triggerName = _escapeQuerySelector(arguments[4]);
                    if(triggerName === trigger){
                        return '';
                    }
                    return $;
                });
                //also remove redundant bracketed sole triggers
                BRACKETED_SINGLE_TRIGGER_PATTERN.lastIndex = 0;
                conditionRuleString = conditionRuleString.replace(BRACKETED_SINGLE_TRIGGER_PATTERN, function($, $1){
                    return DELIMITER + $1 + DELIMITER;
                });
                (this.getConditionalElement()).setAttribute(CONDITIONAL_ATTRIBUTE_NAME, conditionRuleString);
            }
        });

        return extend(Conditional, {
            /**
             * Transform JSON object to Polish notation ( http://en.wikipedia.org/wiki/Polish_notation )
             * @param relationshipObject
             * @return {String}
             */
            makeConditionRules: function(relationshipObject){
                function transform(leafNode){
                    var value = leafNode, id;
                    if(isHTMLElement(leafNode)){ //special handling for dom elements
                        value = leafNode.getAttribute('id') ||
                            (id = wFORMS.helpers.randomId()) && (leafNode.setAttribute('id', id) || id);
                        value = '#' + value;
                    }

                    return DELIMITER + value + DELIMITER;
                }

                function _isObjectDescribingGroup(object){
                    if(object instanceof Array){
                        return true;
                    }
                    if(object.constructor !== Object){
                        return false;
                    }
                    var properties = map(object, function(value, key){
                        return key;
                    });

                    return properties.length > 1;
                }

                function _isLeaf(node){
                    if(typeof node === 'string' || isHTMLElement(node)){
                        return true;
                    }
                    var notTerminalProperties = filter(node || {}, function(value, key){
                        return inArray(['NOT', 'AND', 'OR'], (key || '').toUpperCase());
                    });

                    return !notTerminalProperties || notTerminalProperties.length === 0;
                }

                function _expandGroup(node){
                    return filter(map(node, function(value, key){
                        var obj = {};
                        obj[(key || '').toUpperCase()] = value;
                        return obj;
                    }), function(entry){
                        var keys = map(entry, function(value, key){
                            return key;
                        });
                        return inArray(['NOT', 'AND', 'OR'], keys[0]);
                    });
                }

                function _unpackObject(object){
                    var transformed = {};
                    map(object, function(value, key){
                        transformed.name = key;
                        transformed.value = value;
                    });
                    return transformed;
                }

                function recursive(node){
                    node = node || {};
                    if( _isLeaf(node)){
                        return transform(node);
                    }
                    if (_isObjectDescribingGroup(node)){
                        //deal with an exceptional case that a node represents a compound relationship by itself
                        return new PolishExpression('AND', map(_expandGroup(node), recursive));
                    }

                    var nonTerminal = _unpackObject(node);
                    var value = nonTerminal.value;
                    if(!(value instanceof Array)){
                        value = [value];
                    }

                    var children = [];
                    map(value, function(element){
                        var result = recursive(element);
                        if(result instanceof Array){
                            children = children.concat(result);
                        }else{
                            children.push(result);
                        }
                    });
                    return new PolishExpression(nonTerminal.name, children);
                }
                var result = recursive(relationshipObject);
                return (result && result.toStringy()) || null;
            }
        });
    })();

    var Trigger = (function(){
        /**
         *
         * @param domElement a string, indicating the CSS selector for the DOM element, or the DOM element itself
         * @param referenceDOMTree by default this should be document, however may not exist in document, this can
         * happen when the section the trigger is in is detached.
         * @constructor
         */
        function Trigger(domElement, referenceDOMTree){
            var identifier = domElement;
            if( typeof domElement !== 'string'){
                //treat it as an existing DOM element
                identifier = '#' + getOrAssignID(domElement);
            }
            this._triggerElementIdentifier = _escapeQuerySelector(identifier);

            this.referenceDOMTree = referenceDOMTree || document;
        }


        //private functions
        function _retrieveConditionals(instance){
            var triggerDOMElement = instance.getTriggerElement();
            if(!triggerDOMElement){
                return [];
            }
            var conditionalsDef = triggerDOMElement.getAttribute(TRIGGER_CONDITIONALS);
            if(!conditionalsDef ){
                return [];
            }
            return map(conditionalsDef.split(','), function(conditionalSelector){
                var e;
                try{
                    return new Conditional(trim(conditionalSelector));
                }catch(e){
                    return null
                }
            });
        }

        function _conditionalToPattern(conditionals){
            return map(conditionals, function(conditonal){
                return conditonal.getIdentifier();
            }).join(',');
        }

        function _storeConditionalsToPatternAttribute(instance, conditionals){
            conditionals = filter(conditionals, function(conditional){
                return conditional instanceof Conditional;
            });
            if(!conditionals){
                return null;
            }

            //if this trigger links to a valid DOM element?
            var domElement = instance.getTriggerElement();
            if(!isHTMLElement(domElement)){
                throw new Error('Cannot store Conditionals to this Trigger object. The inferred DOM object doesn\'t exist');
            }

            var pattern = _conditionalToPattern(conditionals);

            domElement.setAttribute(TRIGGER_CONDITIONALS, pattern);
            return pattern;
        }

        extend(Trigger.prototype, {
            attachedConditionals: [],

            /**
             * For test purpose only, no need to use this function unless absolutely necessary.
             * @return {*}
             * @private
             */
            _getConditionalsPattern: function(){
                return _conditionalToPattern(this.getConditionals());
            },

            setEventListener: function() {
                var n = this.getTriggerElement();

                if(n && n.tagName=='OPTION') {
                    while(n && n.tagName!='SELECT') { n = n.parentNode; }
                }

                if(!n || n.__wforms_event_handled) return;

                if(n.tagName == 'INPUT' && n.getAttribute('type') == 'radio' ){
                    var radioButtons = n.form[ n.getAttribute('name') ];
                    if(!radioButtons.length) {
                        // not a nodelist. Found just one match.
                        radioButtons = [radioButtons];
                    }
                    for(var i=0; i<radioButtons.length;i++) {
                        var radioButton = radioButtons[i];
                        base2.DOM.Element.addEventListener(radioButton, 'change', EventHandlers.document, false);
                        radioButton.__wforms_event_handled = true;
                    }

                } else {
                    base2.DOM.Element.addEventListener(n, 'change', EventHandlers.document, false);
                    n.__wforms_event_handled = true;
                }
            },

            getIdentifier: function(){
                return this._triggerElementIdentifier;
            },

            getTriggerElement: function(){
                try{
                    return base2.DOM.Element.querySelector(this.referenceDOMTree, this._triggerElementIdentifier);
                }catch(e){
                    return null;
                }
            },

            getValue: function(){
                var triggerElement = this.getTriggerElement();
                if(!triggerElement){
                    return DEFAULT_NON_EXIST_TRIGGER_VALUE;
                }

                // disabled elements are always "false"
                if(triggerElement.disabled) {
                    return false;
                }
                // select fields hold their disabled state on the select element.
                if(triggerElement.tagName === 'OPTION'){
                    var p = triggerElement.parentNode;
                    while(p && p.tagName != 'SELECT') { p = p.parentNode; }
                    if(p && p.disabled) {
                        return false;
                    }
                }

                if( triggerElement.tagName === 'INPUT') {
                    var type = base2.DOM.Element.getAttribute(triggerElement, 'type');
                    if( type === 'checkbox' || type === 'radio' ){
                        return triggerElement.checked? true : false
                    }else if(type === 'text' ){
                        return trim(triggerElement.value).length !== 0;
                    }
                }else if(triggerElement.tagName === 'TEXTAREA'){
                    return trim(triggerElement.value).length !== 0;
                }else if(triggerElement.tagName === 'OPTION'){
                    return triggerElement.selected;
                }else if(triggerElement.tagName === 'SELECT'){
                    if(triggerElement.selectedIndex > 0) {
                        return true;
                    }
                    for(var i = 0, l = triggerElement.options.length; i < l; i++) {
                        var option = triggerElement.options[i];
                        if(option.selected && trim(option.value).length > 0) {
                            return true;
                        }
                    }
                    return false;
                }
                return false;
            },

            getConditionals: function(){
                return _retrieveConditionals(this);
            },

            replaceConditionals: function(conditionals){
                return _storeConditionalsToPatternAttribute(this, conditionals);
            },

            addConditional: function(conditional){
                var existingConditionals = this.getConditionals();
                var duplicatedEntries = filter(existingConditionals, function(_conditional){
                    return _conditional.equals(conditional);
                });

                if(duplicatedEntries.length !== 0){ // if conditional is already associated
                    return null; //do nothing, don't add the conditional in
                }

                existingConditionals.push(conditional);
                return _storeConditionalsToPatternAttribute(this, existingConditionals);
            },
            removeConditional: function(conditional){
                var existingConditionals = this.getConditionals();
                var unduplicatedEntries = filter(existingConditionals, function(_conditional, index){
                    return !_conditional.equals(conditional);
                });
                return _storeConditionalsToPatternAttribute(this, unduplicatedEntries);
            },

            trigger: function(){

                var element = this.getTriggerElement();
                if(wFORMS.behaviors.condition._triggerChain && (element.id in wFORMS.behaviors.condition._triggerChain)) {
                    // Infinite loop detected, or is an initialization run over a nested trigger that has already been executed.
                    return;
                } else {

                    wFORMS.behaviors.condition._triggerChain[element.id] = true;

                    var activeConditionals = filter(this.getConditionals(), function(conditional){
                        return conditional && conditional.getConditionalElement();
                    });

                    map(activeConditionals, function(conditional){
                        conditional.refresh();
                    });
                }
            },

            isValid : function(){
                var triggerDOMElement;
                return (triggerDOMElement = this.getTriggerElement())
                    && triggerDOMElement.getAttribute(TRIGGER_CONDITIONALS);
            }
        });

        return Trigger;
    })();

    var EventHandlers = {
        document: function(event){
            var target = event.target;
            if(!target){
                return;
            }

            wFORMS.behaviors.condition.resetTriggerExecutionChain();

            if(target.tagName === 'SELECT'){
                for(var i=0;i<target.options.length;i++) {
                    var o = target.options[i];
                    if(o.getAttribute(TRIGGER_CONDITIONALS)) {
                        (new Trigger(o)).trigger();
                    }
                }
            } else {

                //then check if target is a radio button
                if(target.tagName === 'INPUT' && target.getAttribute('type') === 'radio' ){
                    var name = target.getAttribute('name');
                    //then we have to trigger the radio button in the same group
                    var radioButtons = target.form[name];// base2.DOM.Element.querySelectorAll(document,'input[type="radio"][name="' + name +'"]');

                    if(!radioButtons.length) {
                        // not a nodelist. Found just one match.
                        radioButtons = [radioButtons];
                    }
                    for(var i=0; i<radioButtons.length;i++) {
                        var radioButton = radioButtons[i];
                        (new Trigger(radioButton)).trigger();
                    }
                } else {
                    if(target.getAttribute(TRIGGER_CONDITIONALS) ){ // if the element has a TRIGGER_CONDITIONALS attribute,
                        // respond to this event
                        (new Trigger(target)).trigger();
                    }
                }
            }
        },

        onRepeatableDuplicated: function(masterNode, duplicateNode, idMappings){
            var involvedConditionals = [];

            wFORMS.behaviors.condition.resetTriggerExecutionChain();

            //pre-process raw parameter
            idMappings = _preprocessParameter(idMappings);

            //find conditional correspondence
            var conditionalMapping = reduce(idMappings.repeat, function(mappedTo, original, sum){
                if(!(new Conditional(original)).isValid()){
                    return sum;
                }
                sum[original] = mappedTo;
                return sum;
            }, {});

            //1 rename triggers in their associated conditionals and the clones of those conditionals
            _renameTriggers(idMappings.master, conditionalMapping, involvedConditionals);

            //2 update the conditionals' references if they are renamed
            _renameConditionals(idMappings, involvedConditionals);

            //3 handle cloned triggers
            _consolidateTriggers(idMappings.repeat, masterNode, duplicateNode, involvedConditionals);

            map(removeDuplicates(involvedConditionals), function(conditionalIdentifier){
                var conditional = new Conditional(conditionalIdentifier);
                conditional.refresh();
            })
        },

        onRepeatableRemoved: function(removedCopy){
            //detach those removed conditionals
            _detachConditionals(removedCopy);

            //detach those removed triggers
            _detachTriggers(removedCopy);
        }
    };



    return { // the ultimate object that will become wFORMS.behaviors['condition']

        applyTo: function(domElement){

            this.resetTriggerExecutionChain();

            var triggersElements = base2.DOM.Element.querySelectorAll(domElement, "[" + TRIGGER_CONDITIONALS + "]");

            // Run every trigger once to set the initial state of all conditional rules.
            triggersElements.forEach(function(triggerElement){
                var trigger = new Trigger(triggerElement);
                trigger.trigger();
                trigger.setEventListener();
            });

            if(triggersElements.length > 0){

                //attach event handler for repeatables
                if(wFORMS.behaviors.repeat){
                    wFORMS.behaviors.repeat.observeRepeatComplete(EventHandlers.onRepeatableDuplicated);
                    wFORMS.behaviors.repeat.observeRemoveComplete(EventHandlers.onRepeatableRemoved);
                }
            }
        },

        getConditional: function(domElement){
            return new Conditional(domElement);
        },

        getTrigger: function(domElement){
            return new Trigger(domElement);
        },

        Conditional: Conditional,
        Trigger: Trigger,

        mockup: function(){

        },

        isInitialized: function(){
            return initialized;
        },

        /**
         * True if the element was the target of a conditional rule and was turned off by the rule.
         * @param  {DomElement}  The node (expected to be a section, field wrapper or a page wrapper)
         * @return {Boolean}
         */
        hasOffState: function(n) {
            return base2.DOM.HTMLElement.hasClass(n,'offstate');
        },

        resetTriggerExecutionChain: function() {
            wFORMS.behaviors.condition._triggerChain = {};
        }
    }
})();