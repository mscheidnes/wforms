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
        beforeEach(function(){
            loadFixtures( 'auto-format.html' );

            waitsFor(function(){
                return wFORMS.initialized === true;
            }, 'wait for wForms initializing', 100);
        });

        afterEach(function(){
        });

        it("should be able to create cache entries for the following input types: text, email, url", function(){
        });
    });
})();

