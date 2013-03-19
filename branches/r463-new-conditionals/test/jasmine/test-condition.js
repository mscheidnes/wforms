(function(){
    'use strict';

    describe('The condition behaviour should be able to generate a rule string based on a javascript object',
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
            expect(ruleString, ' ( `A` AND `B` AND `C` AND ( `C` OR `D` ) AND `E` AND ( `F` AND `G` AND ( `H` OR `I` OR `J` ) ) ) ');
        });

        var case3JSON = {
            'AnD': ['A', 'B', 'C', {
                'or' : ['C', 'D']
            }]
        };
        it("should not discriminate letter case of the logical operators " + JSON.stringify(case3JSON), function(){
            var ruleString = wFORMS.behaviors.condition.Conditional.makeConditionRules(case3JSON);
            expect(ruleString,  '( `A` AND `B` AND `C` AND ( `C` OR `D` ) ) ');
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
            expect(ruleString, ' ( ( `A` AND `B` AND ( ( `F` OR `G` ) AND ( `H` AND `I` ) ) AND `C` ) AND ( `D` OR `E` ) ) ');
        })
    })
})();