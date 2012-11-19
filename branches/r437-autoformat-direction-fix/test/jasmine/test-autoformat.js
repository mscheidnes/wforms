/**
 * User: anch
 * Date: 9/9/12
 * Time: 8:36 PM
 */
/*global jasmine:true
    describe:true
    it:true
    afterEach:true
    runs:true
    waitsFor:true
    expect:true
*/

(function(){
    'use strict';

    describe("The wForms autoformat behaviour", function(){
        var $ssnInput;
        var $rightDirectionalInput;
        beforeEach(function(){
            loadFixtures( 'auto-format.html' );

            waitsFor(function(){
                return wFORMS.initialized === true;

            }, 'wait for wForms initializing', 100);

            runs(function(){
                $ssnInput = $('#ssn');
                $rightDirectionalInput = $('#right');
            });
        });

        it("should generate a ghostly shadow layer", function(){
            waitsFor(function(){
                return $ssnInput.next('.autoformatprompt').length !== 0;
            }, 'wait for ui initialization', 200);

            runs(function(){
                expect($ssnInput.next()).toBe('.autoformatprompt');
            });
        });

        it("should display the pattern characters in the ghostly shadow layer", function(){
            var $ghostlyShadow = $ssnInput.next();

            runs(function(){
                $ssnInput.focus();
            });

            runs(function(){
                expect($ghostlyShadow.children().length).toEqual($ssnInput.attr('autoformat').length);
            });
        });

        it("should display the ghostly prompt and align the input text to the right if the input is right-directional",
            function(){
                $rightDirectionalInput.focus();
                var $ghostPrompt = $rightDirectionalInput.next('.autoformatprompt');
                var rightMarginBeforeTyping = $rightDirectionalInput.next('.autoformatprompt').css('right');
                //there should be a value for the right position, but not for the left position
                expect($ghostPrompt[0].style.right).not.toBeEmpty();
                expect($ghostPrompt[0].style.left).toBe('');

                //type a character
                UTIL.dispatchKeypressEvent($rightDirectionalInput[0], 49, 0);

                var rightMarginAfterTyping = $ghostPrompt.css('right');
                //after a new character is typed, the ghostly prompt should shift left
                expect(UTIL.getValue(rightMarginBeforeTyping)).toBeLessThan(UTIL.getValue(rightMarginAfterTyping));
            });



    });
})();

