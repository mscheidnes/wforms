(function(){
    'use strict';

    xdescribe('The Conditional class should be able to generate a rule string based on a javascript object',
    function(){
        beforeEach(function(){
            loadFixtures( 'condition.html' );

            waitsFor(function(){
                return wFORMS.initialized === true;
            }, 'wait for wForms initializing', 100);

            runs(function(){
            });
        });

        var case1JSON = {
            'AND': ['A', 'B', 'C']
        };
        it("should be able to convert json object " + JSON.stringify(case1JSON), function(){
            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case1JSON);

            expect(ruleString ).toBe(' ( `A` AND `B` AND `C` ) ');
        });

        var case2JSON = {
            'AND': ['A', 'B', 'C', {
                'OR' : ['C', 'D']
            }, 'E', {
                'AND' : ['F', 'G', {'OR': ['H', 'I', 'J']}]
            }]
        };
        it("should be able to handle nested relationship " + JSON.stringify(case2JSON), function(){
            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case2JSON);
            expect(ruleString).toBe(' ( `A` AND `B` AND `C` AND ( `C` OR `D` ) AND `E` AND ( `F` AND `G` AND ( `H` OR `I` OR `J` ) ) ) ');
        });

        var case3JSON = {
            'AnD': ['A', 'B', 'C', {
                'or' : ['C', 'D']
            }]
        };
        it("should not discriminate letter case of the logical operators " + JSON.stringify(case3JSON), function(){
            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case3JSON);
            expect(ruleString).toBe(' ( `A` AND `B` AND `C` AND ( `C` OR `D` ) ) ');
        });

        var case4JSON = {
            'AND': ['A', 'B', {
                'OR' : ['F', 'G'],
                'AND' : ['H', 'I']
            }, 'C'],
            'OR' : ['D', 'E']
        };
        it('when a logical describer contains multiple logical operators, '
            + 'the result of each logical operation will be joined together by "AND" '
            + JSON.stringify(case4JSON), function(){
            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case4JSON);
            expect(ruleString).toBe(' ( ( `A` AND `B` AND ( ( `F` OR `G` ) AND ( `H` AND `I` ) ) AND `C` ) AND ( `D` OR `E` ) ) ');
        });

        it('should be able to deal with mixed DOM and string operands. '
            + 'DOM operands will be replaced by their ids', function(){
            var $inputs = $('#test-group1').find('input:checkbox');

            var case5JSON = {
                'AND': ['A', 'B', $inputs[0], $inputs[1]]
            };

            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case5JSON);
            expect(ruleString).toBe(' ( `A` AND `B` AND `option1` AND `option2` ) ');
        });

        it('if a dom object doesn\'t have an ID, a random one will be generated for it. ', function(){
            var $inputs = $('#test-group1').find('input:checkbox');

            var case6JSON = {
                'AND': ['A', 'B', $inputs[2], $inputs[3]]
            };
            var backup = wFORMS.helpers.randomId;
            wFORMS.helpers.randomId = function(){
                return 'id_a_random_one'
            };

            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case6JSON);
            wFORMS.helpers.randomId = backup;
            expect(ruleString).toBe( ' ( `A` AND `B` AND `option3` AND `id_a_random_one` ) ');
        })
    });

    describe('The Conditional class',
    function(){
        beforeEach(function(){
            loadFixtures( 'condition.html' );

            waitsFor(function(){
                return wFORMS.initialized === true;
            }, 'wait for wForms initializing', 100);

            runs(function(){
            });
        });

        it("should be able to create an instance based on a DOM element with \"data-condition\" attribute", function(){
            var conditionalDOM = base2.DOM.Element.querySelector($('#test-group1')[0], 'fieldset[data-condition]');
            var conditional = new wFORMS.behaviors['condition'].Conditional(conditionalDOM );
            expect(conditional instanceof wFORMS.behaviors['condition'].Conditional).toBeTruthy();
        });

        it("should throw an exception for a DOM element without \"data-condition\" attribute", function(){
            var conditionalDOM = base2.DOM.Element.querySelector($('#test-group1')[0], 'fieldset:not([data-condition])');
            expect(function(){
                new wFORMS.behaviors['condition'].Conditional(conditionalDOM );
            }).toThrow();
        });

        it("a instance should be able to extract triggers from its data-condition attribute", function(){
            var conditionalDOM = base2.DOM.Element.querySelector($('#test-group1')[0], 'fieldset[data-condition]');
            var conditional = new wFORMS.behaviors['condition'].Conditional(conditionalDOM );

            $.each(conditional.getTriggers(), function(index, trigger){
                expect(trigger instanceof wFORMS.behaviors['condition'].Trigger).toBeTruthy();
            });
        });

        it("getTriggers() should still return triggers for invalid selectors", function(){
            var conditionalDOM = base2.DOM.Element.querySelector($('#test-group2')[0], 'fieldset[data-condition]');
            var conditional = new wFORMS.behaviors['condition'].Conditional(conditionalDOM );

            var triggers = conditional.getTriggers();
            // the 3rd trigger should still be a trigger instance
            expect(triggers[2] instanceof wFORMS.behaviors['condition'].Trigger).toBeTruthy();
            expect(triggers[2].getTriggerElement()).toBeNull();
        });

        it("it should link itself to the triggers described in its conditional rule", function(){
            var conditional = new wFORMS.behaviors['condition'].Conditional('#unlinked-conditional');
            conditional.linkTriggers();

            var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');
            expect(trigger._getConditionalsPattern()).toBe('#field1,#unlinked-conditional');

            trigger = new wFORMS.behaviors['condition'].Trigger('#option2');
            expect(trigger._getConditionalsPattern()).toBe('#field1,#invalid-fieldset,#unlinked-conditional');

            trigger = new wFORMS.behaviors['condition'].Trigger('#option3');
            expect(trigger._getConditionalsPattern())
                .toBe('#field1,#invalid-fieldset,form .non-exist-conditonal,#unlinked-conditional');
        });

        it("it should unlink itself from the triggers associated with this conditional", function(){
            var conditional = new wFORMS.behaviors['condition'].Conditional('#field1');
            conditional.unlinkTriggers();

            var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');
            expect(trigger._getConditionalsPattern()).toBe('');

            trigger = new wFORMS.behaviors['condition'].Trigger('#option2');
            expect(trigger._getConditionalsPattern()).toBe('#invalid-fieldset');

            trigger = new wFORMS.behaviors['condition'].Trigger('#option3');
            expect(trigger._getConditionalsPattern())
                .toBe('#invalid-fieldset,form .non-exist-conditonal');
        });
    });

    xdescribe('The Trigger class',
        function(){
            beforeEach(function(){
                loadFixtures( 'condition.html' );

                waitsFor(function(){
                    return wFORMS.initialized === true;
                }, 'wait for wForms initializing', 100);

                runs(function(){
                });
            });

            it("should be able to restored the trigger DOM object by its identifier", function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');
                var triggerDOM = document.getElementById('option1');
                expect(trigger.getTriggerElement()).toBe(triggerDOM);
            });

            it("should be able to restore its associated conditionals by looking at \"data-conditional\" attribute ",
            function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');
                var conditionals = trigger.getConditionals();
                expect(conditionals.length).toBe(1);
                expect(conditionals[0].getConditionalElement()).toBe($('#field1')[0]);
            });

            it("should be able to handle multiple conditionals",
                function(){
                    var trigger = new wFORMS.behaviors['condition'].Trigger('#option2');
                    var conditionals = trigger.getConditionals();

                    expect(conditionals.length).toBe(2);
                    expect(conditionals[0].getConditionalElement()).toBe($('#field1')[0]);
                    expect(conditionals[1].getConditionalElement()).toBe($('#invalid-fieldset')[0]);
            });

            it("should still return a Conditional instance for non-existing conditionals",
                function(){
                    var trigger = new wFORMS.behaviors['condition'].Trigger('#option3');
                    var conditionals = trigger.getConditionals();

                    expect(conditionals.length).toBe(3);
                    $.each(conditionals, function(i, conditional){
                        expect(conditional instanceof wFORMS.behaviors['condition'].Conditional).toBeTruthy();
                    });
                    expect(conditionals[0].getConditionalElement()).toBe($('#field1')[0]);
                    expect(conditionals[1].getConditionalElement()).toBe($('#invalid-fieldset')[0]);
                    expect(conditionals[2].getConditionalElement()).toBeNull();
            });

            it("should update its conditional pattern attribute by conditional instances", function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');

                expect(trigger._getConditionalsPattern()).toBe('#field1');

                var conditionals = $.map(['#field1', '#invalid-fieldset'], function(id){
                    return new wFORMS.behaviors['condition'].Conditional(id);
                });

                trigger.replaceConditionals(conditionals);

                expect(trigger._getConditionalsPattern()).toBe('#field1,#invalid-fieldset');
            });

            it("should be able to add a new conditional to its pattern attribute", function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');

                var conditional = new wFORMS.behaviors['condition'].Conditional('#invalid-fieldset');

                trigger.addConditional(conditional);

                expect(trigger._getConditionalsPattern()).toBe('#field1,#invalid-fieldset');
            });

            it("adding the same conditional in will not get it duplicated", function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');

                var conditional = new wFORMS.behaviors['condition'].Conditional('#field1');
                trigger.addConditional(conditional);
                expect(trigger._getConditionalsPattern()).toBe('#field1');

                conditional = new wFORMS.behaviors['condition'].Conditional('#test-group1 fieldset[data-condition]');
                trigger.addConditional(conditional);
                expect(trigger._getConditionalsPattern()).toBe('#field1');
            });

            it("should be able to remove a conditional from its pattern attribute", function(){
                var trigger = new wFORMS.behaviors['condition'].Trigger('#option1');

                var conditional = new wFORMS.behaviors['condition'].Conditional('#field1');

                trigger.removeConditional(conditional);
                expect(trigger._getConditionalsPattern()).toBe('');

                trigger = new wFORMS.behaviors['condition'].Trigger('#option3');
                trigger.removeConditional(conditional);
                expect(trigger._getConditionalsPattern()).toBe('#invalid-fieldset,form .non-exist-conditonal');
            });
        });
})();