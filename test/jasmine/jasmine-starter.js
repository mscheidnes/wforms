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
