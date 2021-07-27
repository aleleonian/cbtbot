require('dotenv').config()
const axios = require('axios');

var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;

var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;
let urlToTest = process.env.TESTPAGE;
let testResultsUrl = process.env.TESTRESULPAGE;

let testResultsArray = [];

var webdriver = require('selenium-webdriver'),
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
    request = require('request');
const { By, until } = require('selenium-webdriver');

var remoteHub = "http://" + username + ":" + authkey + "@hub.crossbrowsertesting.com:80/wd/hub";

var browsers = [
    { browserName: 'Chrome', platform: 'Windows 10', version: '64', screen_resolution: '1366x768' },
    { browserName: 'Chrome', platform: 'Mac OSX 10.14', version: '71x64', screen_resolution: '1366x768' },
];


var flows = browsers.map(function (browser) {

    return new Promise((resolve, reject) => {

        var caps = {
            name: 'Vernon Parallel Example',
            browserName: browser.browserName,
            version: browser.version,
            platform: browser.platform,
            screen_resolution: browser.screen_resolution,
            username: username,
            password: authkey
        };

        async function getTestResults(testId) {

            return new Promise((resolve, reject) => {
                axios.get(`${testResultsUrl}?id=${testId}`)
                    .then(response => {
                        resolve(response.data)
                    })
                    .catch(error => {
                        reject(error);
                    });
            })

        }

        async function parallelExample() {


            try {
                var driver = new webdriver.Builder()
                    .usingServer(remoteHub)
                    .withCapabilities(caps)
                    .build();

                let sessionId;

                await driver.getSession().then(function (session) {
                    sessionId = session.id_; //need for API calls
                    console.log('Session ID: ', sessionId);
                    console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId)
                });

                await driver.get(urlToTest + `?c3=${sessionId}`);

                let taskFinishedElement = await driver.findElement(By.id('taskFinished'));

                await driver.wait(until.elementTextIs(taskFinishedElement, "TASK FINISHED."));

                driver.quit();

                let testResults = await getTestResults(sessionId);

                testResultsArray.push(testResults);

                resolve(true)

            }
            catch (err) {
                console.error('Exception!\n', err.stack, '\n');
                driver.quit();
                reject(false);
            }
        }

        parallelExample();
    })
});

async function main() {

    console.log("Starting tests...");
    
    await Promise.all(flows);

    console.log("Finished los hits!");

    let howManyEntries = testResultsArray.length;

    console.log(`${browsers.length} tests expected, got ${howManyEntries}.`)

    if (howManyEntries == browsers.length) {

        console.log("Got all the expected test results.");
        process.exitCode = 0

    }

    else {

        console.log("Did not get all the expected test results.");
        process.exitCode = 1
    }

    console.log("length->" + testResultsArray.length);

    console.log("testResultsArray->" + JSON.stringify(testResultsArray));

    

    for (let i = 0; i < testResultsArray.length; i++) {

        let aSession = testResultsArray[i];

        if (!aSession.data.postct.eos) {
            console.log(`Session ${aSession.data.postct.c3} has no EOS`);
        }
        else {
            console.log(`Session ${aSession.data.postct.c3} EOS -> ${aSession.data.postct.eos}`);
        }

    }

}

main();

