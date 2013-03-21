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

    describe("A wForms length prompt behaviour", function(){
        beforeEach(function(){
            loadFixtures( 'length-prompt.html' );

            waitsFor(function(){
                return wFORMS.initialized === true;
            }, 'wait for wForms initializing', 100);
        });

        it("should be able to create cache entries for the following input types: text, email, url", function(){
            expect($('input[type="text"]').attr('id') in wFORMS.behaviors.lengthPrompt._globalCache).toBeTruthy();
            expect($('input[type="email"]').attr('id') in wFORMS.behaviors.lengthPrompt._globalCache).toBeTruthy();
            expect($('input[type="url"]').attr('id') in wFORMS.behaviors.lengthPrompt._globalCache).toBeTruthy();
        });

        it("should be able to create cache entries for the textarea", function(){
            expect($('textarea').attr('id') in wFORMS.behaviors.lengthPrompt._globalCache).toBeTruthy();
        });
    });
})();

