if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}

wFORMS.behaviors['condition'] = (function(){
    'use strict';

    var DELIMITER = '`';

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

    function inArray(array, value){
        for(var i = 0, l = array.length; i < l; i ++){
            if(value === array[i]){
                return true;
            }
        }
        return false;
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

    //classes
    var Conditional = (function(){
        function Conditional(domElement){

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
        function _parseConditionRule(instance){

        }

        //public functions
        extend(Conditional.prototype, {
            syncTriggers: function(){

            },

            getTriggers: function(){

            }
        });

        return extend(Conditional, {
            makeConditionRules: function(relationshipObject){
                //transform object to tree
                function transform(leafNodeValue){
                    return DELIMITER + leafNodeValue + DELIMITER;
                }

                var polishExpression = treeReduce(relationshipObject, function(treeNode, children){
                    if(!children){ // leaf nodes
                        return transform(treeNode.value);
                    }
                    //if current treeNode is a one child node, and the only chlid is an operator node, then lift it up
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

    return { // the ultimate object that will become wFORMS.behaviors['condition']
        applyTo: function(domElement){
        },

        getConditional: function(domElement){

        },

        getTrigger: function(domElement){

        },

        Conditional: Conditional
    }
})();

//conditional
//trigger