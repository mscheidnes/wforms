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
    var DEFAULT_CONDITIONAL_DISPLAY_VALUE = 'block';

    //Private members
    var initialized = false;

    function initialization(){
        if( initialized ){
            return;
        }
        //bind events
        //false means handle the event in bubbling phase
        base2.DOM.Element.addEventListener(document, 'click', EventHandlers.document, false);
        base2.DOM.Element.addEventListener(document, 'keydown', EventHandlers.document, false);

        //attach event handler for repeatables
        if(wFORMS.behaviors.repeat){
            wFORMS.behaviors.repeat.observeRepeatComplete(EventHandlers.onRepeatableDuplicated);
            wFORMS.behaviors.repeat.observeRemoveComplete(EventHandlers.onRepeatableRemoved);
        }

        initialized = true;
    }


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
            throw {message: 'not a dom element'};
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
                    throw {message: 'this element doesn\'t have a "'+CONDITIONAL_ATTRIBUTE_NAME+'" attribute'};
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
            toString: function(){
                var components = map(this.operands, function(operand){
                    if(operand instanceof PolishExpression){
                        return operand.toString();
                    }
                    return ' ' + operand + ' ';
                });

                if(this.operator === 'NOT'){
                    return ' ( NOT(' + components[0] + ') ) '
                }

                return ' (' + components.join(this.operator) + ') '
            }
        });

        //private functions
        var COMPONENT_PATTERN = new RegExp(DELIMITER + '([^'+DELIMITER+']+)' + DELIMITER, 'g');
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
                    throw {message: "The inferred DOM element doesn't have a rule string"};
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
                    throw {message: "The inferred DOM element doesn't have a rule string"};
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
            makeConditionRulesOld: function(relationshipObject){
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
                            return inArray(['AND', 'OR', 'NOT'], (child.name + '').toUpperCase());
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

                    if( (treeNode.name + '').toUpperCase() === 'NOT'){
                        console.log( childrenValues );
                    }

                    //convert operator node to Polish Expression
                    if(inArray(['AND', 'OR', 'NOT'], (treeNode.name + '').toUpperCase())){
                        return new PolishExpression(treeNode.name, childrenValues);
                    }
                    return childrenValues;
                });

                console.log(polishExpression);
                return polishExpression.toString();
            },

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

                    return properties.length >= 2;
                }

                function _isLeaf(node){
                    var notTerminalProperties = filter(node || {}, function(value, key){
                        return inArray(['NOT', 'AND', 'OR'], key);
                    });

                    return notTerminalProperties && notTerminalProperties.length > 0;
                }

                function _getGroup(){

                }

                function recursive(node){
                    node = node || {};
                    var name = node.name;
                    var value = node.value;
                    if( _isLeaf(value)){
                        return transform(value);
                    }
                    var children;

                    if(value instanceof Array){
                        children = map(value, function(i, v){
                            return {name: null, value: v};
                        });
                    }else{
                        children = filter(value, function(v, k){
                            if( !inArray(['NOT', 'AND', 'OR'], k) ){
                                return false;
                            }
                            return { name: k, value: v};
                        })
                    }

                    var childrenValues = map(children, recursive);
                    if(name){
                        return new PolishExpression(name, childrenValues);
                    }
                    return childrenValues[0];
                }
                var result = recursive(relationshipObject);

                console.log(result)
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

            var conditionalsPattern = target.getAttribute(TRIGGER_CONDITIONALS);
            if(conditionalsPattern ){ // if the element has a TRIGGER_CONDITIONALS attribute,
                // respond to this event
                (new Trigger(target)).trigger();
            }

            //then check if target is a radio button
            if(target.tagName === 'INPUT' && base2.DOM.Element.getAttribute(target, 'type') === 'radio' ){
                var name = base2.DOM.Element.getAttribute(target, 'name');
                //then we have to trigger the radio button in the same group
                var radioButtons = base2.DOM.Element.querySelectorAll(document,
                    'input[type="radio"][name="' + name +'"]');
                radioButtons.forEach(function(radioButton){
                    return (new Trigger(radioButton)).trigger();
                })
            }
        },

        onRepeatableDuplicated: function(masterNode, duplicateNode, idMappings){
            var involvedConditionals = [];

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
        Trigger: Trigger,

        mockup: function(){

        },

        isInitialized: function(){
            return initialized;
        }

    }
})();