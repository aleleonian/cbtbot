require('dotenv').config()

const axios = require('axios');

var argv = require('minimist')(process.argv.slice(2));

let sessionGroupName = "";

if (argv['name']) sessionGroupName = argv['name'];


var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;

var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;
let urlToTest = process.env.TESTPAGE;
let testResultsUrl = process.env.TESTRESULPAGE;

let sessionTimeOut = 5;

let testResultsArray = [];

var webdriver = require('selenium-webdriver'),
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
    request = require('request');
const { By, until } = require('selenium-webdriver');

var remoteHub = "http://" + username + ":" + authkey + "@hub.crossbrowsertesting.com:80/wd/hub";

var browsers = require("./browsers.all.cbt.json");

let randomBrowsers = [];

let howManySessions = 1;

generateRandomBrowserList()


var flows = randomBrowsers.map(function (browser) {

    return new Promise(async (resolve, reject) => {

        var caps = {
            name: `Vernon test ->${sessionGroupName}`,
            browserName: browser.browserName,
            version: browser.version,
            platform: browser.platform,
            screen_resolution: browser.screen_resolution,
            username: username,
            password: authkey
        };


        try {
            var driver = new webdriver.Builder()
                .usingServer(remoteHub)
                .withCapabilities(caps)
                .build();

            let sessionId;

            await driver.getSession().then(function (session) {
                sessionId = session.id_; //need for API calls
                // console.log('Session ID: ', sessionId);
            });

            console.log(`hitting ${urlToTest}?c3=${sessionId} | see at https://app.crossbrowsertesting.com/selenium/${sessionId}`);

            let timeOutTimer = setTimeout(async () => {
                console.log(`Aborting cbt session ${sessionId} due to timeout.`);
                throw ("Session timeout");
            }, sessionTimeOut * 1000);

            await driver.get(urlToTest + `?c3=${sessionId}`);

            let taskFinishedElement = await driver.findElement(By.id('taskFinished'));

            await driver.wait(until.elementTextIs(taskFinishedElement, "TASK FINISHED."));

            await driver.quit();

            let testResults = await getTestResults(sessionId);

            testResultsArray.push(testResults);

            resolve(true)

        }
        catch (err) {
            // console.error('Exception!\n', err.stack, '\n');
            console.error('Exception!\n', err, '\n');
            await driver.quit();
            resolve(false);
        }
    })
});

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
async function main() {

    console.log("Starting tests...");

    await Promise.all(flows);

    console.log("Finished los hits!");

    let howManyEntries = testResultsArray.length;

    console.log(`${randomBrowsers.length} tests expected, got ${howManyEntries}.`)

    if (howManyEntries == randomBrowsers.length) {

        console.log("Got all the expected test results.");
        process.exitCode = 0

    }

    else {

        console.log("Did not get all the expected test results.");
        process.exitCode = 1
    }

    // console.log("length->" + testResultsArray.length);

    // console.log("testResultsArray->" + JSON.stringify(testResultsArray));





}

function showResults() {
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

function generateRandomBrowserList() {
    for (let i = 0; i < howManySessions; i++) {
        let random_index;
        while (!random_index) {
            let tmp = Math.floor(Math.random() * browsers.length);
            if (!randomBrowsers.filter((g) => browsers[tmp] == g).length)
                random_index = tmp;
        }
        randomBrowsers.push(browsers[random_index]);
    }
}
main();

