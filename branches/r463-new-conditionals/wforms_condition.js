if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}

wFORMS.behaviors['condition'] = (function(){
    'use strict';

    var DELIMITER = '`';
    var CONDITIONAL_ATTRIBUTE_NAME = 'data-condition';
    var TRIGGER_CONDITIONALS = 'data-conditionals';
    var TRIGGER_DEFAULT_ENABLED = true;
    var DEFAULT_NON_EXIST_TRIGGER_VALUE = false;
    var DEFAULT_CONDITIONAL_DISPLAY_VALUE = 'block';

    function initialization(){
        //bind events
        //false means handle the event in bubbling phase
        base2.DOM.Element.addEventListener(document, 'click', EventHandlers.document, false);
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

    function matchAll(enumerable, callback){
        var allMatched = true;
        map(enumerable, function(value, key){
            if(!callback.apply(null, arguments)){
                allMatched = false;
            }
        });
        return allMatched;
    }

    function pluck(object, propertyNames){
        var _result = {};
        map(object, function(e, key){
            if(inArray(propertyNames, key)){
                _result[key] = e;
            }
        });
        return _result
    }

    function treeReduce(treeNode, callback){
        function recursion(_treeNode){
            var value = _treeNode.value;
            if(! (value instanceof Array) && value.constructor !== Object){
                //leaf node (terminal nodes)
                return callback(_treeNode, null);
            }//only treat those array, or plain object types as non-terminal nodes

            var children = map(_treeNode.value, function(value, key){
                return {name: key, value: value};
            });
            var childrenValues = map(children, function(entry){
                return {name: entry.name, value: recursion(entry)};
            });
            return callback(_treeNode, childrenValues);
        }
        return recursion({name: null, value: treeNode});
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

    function getOrAssignID(domElement){
        if( !isHTMLElement(domElement)){
            throw {message: 'not a dom element'};
        }
        var id;
        return domElement.getAttribute('id') || (id = wFORMS.helpers.randomId() &&
            (domElement.setAttribute('id', id) || id))
    }

    var inArray = wFORMS.helpers.contains;
    var isHTMLElement = wFORMS.helpers.isHTMLElement;

    //classes
    var Conditional = (function(){
        /**
         * @param domElementIdentifier string or DOM element
         * @constructor
         */
        function Conditional(domElementIdentifier){
            this._conditionalDomIdentifier = domElementIdentifier;
            if(typeof domElementIdentifier !== 'string'){
                var domElement = domElementIdentifier;
                this._conditionalDomIdentifier = '#' + getOrAssignID(domElement);

                if(!isHTMLElement(domElement) || !domElement.hasAttribute(CONDITIONAL_ATTRIBUTE_NAME)){
                    throw {message: 'this element doesn\'t have a "'+CONDITIONAL_ATTRIBUTE_NAME+'" attribute'};
                }
            }
        }

        function PolishExpression(operator, operands){
            this.operator = (operator + '').toUpperCase();
            this.operands = operands;
        }
        extend(PolishExpression.prototype, {
            toString: function(){
                var components = map(this.operands, function(operand){
                    if(operand instanceof PolishExpression){
                        return operand.toString();
                    }
                    return ' ' + operand + ' ';
                });

                return ' (' + components.join(this.operator) + ') '
            }
        });

        //private functions
        var COMPONENT_PATTERN = new RegExp(DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER, 'g');

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
                var e;
                try{
                    return base2.DOM.Element.querySelector(document, this._conditionalDomIdentifier)
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
            },

            isConditionMet: function(){
                var conditionRuleString = this.getConditionRuleString();
                if(!conditionRuleString ){
                    //doesn't have a rule string, cannot judge
                    throw {message: "The inferred DOM element doesn't have a rule string"};
                }
                COMPONENT_PATTERN.lastIndex = 0; //reset regex

                var rawBooleanExpression = conditionRuleString.replace(COMPONENT_PATTERN, function($, $sub){
                    var trigger = new Trigger($sub);
                    return trigger.getValue() ? 'true' : 'false';
                });

                var booleanExpression = rawBooleanExpression.replace(/AND/g, '&&').replace(/OR/g, '||');
                return eval(booleanExpression);
            },

            show: function(){
                var conditionalElement = this.getConditionalElement();
                conditionalElement.style.display
                    = conditionalElement.originalDisplaySettings || DEFAULT_CONDITIONAL_DISPLAY_VALUE;
            },

            hide: function(){
                var conditionalElement = this.getConditionalElement();
                var displayValue
                    = base2.DOM.AbstractView.getComputedStyle(window, conditionalElement, '').getPropertyValue('display');
                if(displayValue !== 'none'){
                    conditionalElement.originalDisplaySettings  = conditionalElement.style.display;
                }
                conditionalElement.style.display = 'none';
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

                var polishExpression = treeReduce(relationshipObject, function(treeNode, children){
                    if(!children){ // leaf nodes
                        return transform(treeNode.value);
                    }
                    //if current treeNode is a one child node, and the only child is an operator node, then lift it up
                    if(children.length == 1 && inArray(['AND', 'OR'], (children[0].name + '').toUpperCase())){
                        return children[0].value;
                    }

                    { //dealing with a rare case that the client might put multiple logical operators in one object
                        var logicalOperators = filter(children, function(child){
                            return inArray(['AND', 'OR'], (child.name + '').toUpperCase());
                        });
                        if(logicalOperators.length !== 0 ){
                            //Then the default boolean relationship is hardcoded to 'AND'
                            return new PolishExpression('AND', map(logicalOperators, function(operatorEntry){
                                return operatorEntry.value;
                            }));
                        }
                    }

                    var childrenValues = map(children, function(child){
                        return child.value;
                    });

                    //convert operator node to Polish Expression
                    if(inArray(['AND', 'OR'], (treeNode.name + '').toUpperCase())){
                        return new PolishExpression(treeNode.name, childrenValues);
                    }
                    return childrenValues;
                });

                return polishExpression.toString();
            }
        });
    })();

    var Trigger = (function(){
        /**
         *
         * @param domElement a string, indicating the CSS selector for the DOM element, or the DOM element itself
         * @constructor
         */
        function Trigger(domElement){
            var identifier = domElement;
            if( typeof domElement !== 'string'){
                //treat it as an existing DOM element
                identifier = '#' + getOrAssignID(domElement);
            }
            this._triggerElementIdentifier = identifier;
        }

        //private functions
        function _retrieveConditionals(instance){
            var triggerDOMElement = instance.getTriggerElement();
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
                throw {message: 'Cannot store Conditionals to this Trigger object. The inferred DOM object doesn\'t exist'};
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

            getIdentifier: function(){
                return this._triggerElementIdentifier();
            },
            getTriggerElement: function(){
                var e;
                try{
                    return base2.DOM.Element.querySelector(document, this._triggerElementIdentifier);
                }catch(e){
                    return null;
                }
            },

            getValue: function(){
                var triggerElement = this.getTriggerElement();
                if(!triggerElement){
                    return DEFAULT_NON_EXIST_TRIGGER_VALUE;
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

            activate: function(){
                var triggerElement = this.getTriggerElement();
                triggerElement && (triggerElement.condition_trigger_enabled = true);
            },

            deactivate: function(){
                var triggerElement = this.getTriggerElement();
                triggerElement && (triggerElement.condition_trigger_enabled = false);
            },

            trigger: function(){
                var triggerElement = this.getTriggerElement();
                if(!triggerElement ){
                    return;
                }

                if( typeof triggerElement.condition_trigger_enabled === 'undefined'){
                    triggerElement.condition_trigger_enabled = TRIGGER_DEFAULT_ENABLED;
                }

                if(!triggerElement.condition_trigger_enabled ){
                    return;
                }

                var activeConditionals = filter(this.getConditionals(), function(conditional){
                    return conditional && conditional.getConditionalElement();
                });

                map(activeConditionals, function(conditional){
                    conditional.refresh();
                });
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

            var conditionalsPattern = base2.DOM.Element.getAttribute(target, TRIGGER_CONDITIONALS);
            if(conditionalsPattern ){ // if the element has a TRIGGER_CONDITIONALS attribute,
                // respond to this event
                return (new Trigger(target)).trigger();
            }

            //else check if target is a radio button
            if(target.tagName === 'INPUT' && base2.DOM.Element.getAttribute(target, 'type') === 'radio' ){
                var name = base2.DOM.Element.getAttribute(target, 'name');
                //then we have to trigger the radio button in the same group
                var radioButtons = base2.DOM.Element.querySelectorAll(document,
                    'input[type="radio"][name="' + name +'"]');

                radioButtons.forEach(function(radioButton){
                    return (new Trigger(radioButton)).trigger();
                })
            }
        }
    };

    var _timestamp = (new Date()).getTime();
    var _intervalHandler = window.setInterval(function(){
        if(wFORMS.initialized){
            window.clearInterval(_intervalHandler);
            initialization();
        }
        if((new Date()).getTime() - _timestamp > 5000){
            window.clearInterval(_intervalHandler);
            throw({message: '[Condition] behaviour cannot initialized due to time out'});
        }
    }, 50);

    return { // the ultimate object that will become wFORMS.behaviors['condition']
        applyTo: function(domElement){
            var triggersElements = base2.DOM.Element.querySelectorAll(domElement, "[" + TRIGGER_CONDITIONALS + "]");

            triggersElements.forEach(function(triggerElement){
                var trigger = new Trigger(triggerElement);
                trigger.trigger();
            });
        },

        getConditional: function(domElement){
            return new Conditional(domElement);
        },

        getTrigger: function(domElement){
            return new Trigger(domElement);
        },

        Conditional: Conditional,
        Trigger: Trigger
    }
})();

//conditional
//trigger