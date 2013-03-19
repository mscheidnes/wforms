/**
 * User: anch
 * Date: 11/13/12
 * Time: 12:40 PM
 */
/**
 * jasmine boilerplate
 */
(function () {
    'use strict';

    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 250;

    var htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    jasmine.getFixtures().fixturesPath = 'fixtures';
    jasmine.getFixtures().cleanFixtureAfterEach = false;

    $(jasmine).on('fixture-loaded', function(event, fixtureFileName){
        wFORMS.initialized = false;
        wFORMS.onLoadHandler();
    });

    $(document).ready(function(){
        execJasmine();
    });

    function execJasmine() {
        jasmineEnv.execute();
    }
})();

var UTIL = function(UTIL){

    return $.extend(UTIL, {
        dispatchKeypressEvent: function(element, keyCode, charCode){
            // Create the event
            var evt = document.createEvent( 'KeyboardEvent' );

            // Init the options
            evt.initKeyEvent(
                "keypress",        //  the kind of event
                true,             //  boolean "can it bubble?"
                true,             //  boolean "can it be cancelled?"
                null,             //  specifies the view context (usually window or null)
                false,            //  boolean "Ctrl key?"
                false,            //  boolean "Alt key?"
                false,            //  Boolean "Shift key?"
                false,            //  Boolean "Meta key?"
                keyCode || 0,               //  the keyCode
                charCode || 0);              //  the charCode

            // Dispatch the event on the element
            element.dispatchEvent( evt );
        },

        getValue: function(s){
            return parseFloat(('' + s).replace(/px$/i, ''));
        }
    });
}(UTIL || {});
