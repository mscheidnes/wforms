if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}

wFORMS.behaviors['condition'] = (function(){
    'use strict';

    var DELIMITER = '`';
    var CONDITIONAL_ATTRIBUTE_NAME = 'data-condition';

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

    var inArray = wFORMS.helpers.contains;
    var isHTMLElement = wFORMS.helpers.isHTMLElement;

    //classes
    var Conditional = (function(){
        function Conditional(domElement){
            if( !isHTMLElement(domElement) || !domElement.hasAttribute(CONDITIONAL_ATTRIBUTE_NAME)){
                throw {message: 'cannot initialize an object'};
            }
            this._conditionalDom = domElement;
            this._conditionRuleString = domElement.getAttribute(CONDITIONAL_ATTRIBUTE_NAME);
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
        function _parseConditionRule(instance){

        }

        //public functions
        extend(Conditional.prototype, {
            syncTriggers: function(){

            },

            getTriggers: function(){
                var triggerIdentifiers = [], match;
                COMPONENT_PATTERN.lastIndex = 0;
                while(match = COMPONENT_PATTERN.exec(this._conditionRuleString)){
                    triggerIdentifiers.push(match[1]);
                }

                return map(triggerIdentifiers, function(identifier){
                    return base2.DOM.Element.querySelector(document, identifier)
                })
            },

            getConditionalDom: function(){
                return this._conditionalDom;
            },

            getConditionalDomIdentifier: function(){
                var id;
                return this._conditionalDom.getAttribute('id') || (id = wFORMS.helpers.randomId() &&
                    (this._conditionalDom.setAttribute('id', id) || id))
            },

            isConditionMet: function(){

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
            },

            /**
             * underscore prefixed functions are for unit test purpose only
             */
            _parseConditionRule: _parseConditionRule
        });
    })();

    var Trigger = (function(){
        function Trigger(domElement){

        }

        return Trigger;
    })();

    return { // the ultimate object that will become wFORMS.behaviors['condition']
        applyTo: function(domElement){
        },

        getConditional: function(domElement){
            return new Conditional(domElement);
        },

        getTrigger: function(domElement){

        },

        Conditional: Conditional,
        Trigger: Trigger
    }
})();

//conditional
//trigger