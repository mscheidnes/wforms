(function(){
    'use strict';

    describe("Test Nested Repeated Fields", function(){

        beforeEach(function(){
            loadFixtures( 'repeat.html' );


            waitsFor(function(){
                return wFORMS.initialized === true;
            }, 'wait for wForms initializing', 100);
        });

        it("should insert repeat links", function() {

            expect($('a#tfa_1-wfDL').length).toBeTruthy();
            expect($('a#tfa_2-wfDL').length).toBeFalsy();
            expect($('a#tfa_3-wfDL').length).toBeTruthy();
            expect($('a#tfa_4-wfDL').length).toBeTruthy();

        });

        it("should set parent IDs correctly", function() {

            var instance = wFORMS.getBehaviorInstance(document.getElementById('tfa_1'), 'repeat');
            instance.run();

            expect($('#tfa_1').length).toBeFalsy();
            expect($('#tfa_1\\[0\\]').length).toBeTruthy();
            expect($('#tfa_1\\[1\\]').length).toBeTruthy();

            expect($('#tfa_3\\[0\\]\\[0\\]').length).toBeTruthy();
            expect($('#tfa_4\\[0\\]\\[0\\]\\[0\\]').length).toBeTruthy();

            expect($('#tfa_3\\[1\\]\\[0\\]').length).toBeTruthy();
            expect($('#tfa_4\\[1\\]\\[0\\]\\[0\\]').length).toBeTruthy();

        });

    });
})();