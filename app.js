require('dotenv').config()
const axios = require('axios');
let capsArray = require('./browsers.all.cbt.json')

"use strict";
var webdriver = require("selenium-webdriver");
const { By, until } = require('selenium-webdriver');

var cbtHub = "http://hub.CrossBrowserTesting.com:80/wd/hub";

var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;
let originalUrlToTest = process.env.TESTPAGE;
let urlToTest = "";
let testResultsUrl = process.env.TESTRESULPAGE;

let testResultsArray = [];
let sessionIdArray = [];

let driver;

let sessionName = "botPrudentVersion";

var basicCapInfo = {
    name: 'Vernon Test ' + sessionName,
    build: '1.0',
    record_video: 'true',
    record_network: 'false',
    username: username,
    password: authkey
};

async function doYourthing() {
    try {

        for (let i = 0; i < capsArray.length; i++) {

            caps = { ...basicCapInfo, ...capsArray[i] };

            // console.log("caps->" + JSON.stringify(caps))


            const testId = new Date().getTime();

            urlToTest = originalUrlToTest + `?c3=${testId}`;

            sessionIdArray.push(testId);

            await sendTest(caps, testId);

            let testResults = await getTestResults(sessionIdArray[i]);

            testResultsArray.push(testResults);
        }


        let howManyEntries = testResultsArray.length;

        console.log(`${capsArray.length} tests expected, got ${howManyEntries}.`)

        if (howManyEntries == capsArray.length) {

            console.log("Got all the expected test results.");
            process.exitCode = 0

        }

        else {

            console.log("Did not get all the expected test results.");
            process.exitCode = 1
        }

        for (let i = 0; i < testResultsArray.length; i++) {

            let aSession = testResultsArray[i];

            if (!aSession.data.postct.eos) {
                console.log(`Session ${sessionIdArray[i]} has no EOS`);
            }
            else
            {
                console.log(`Session ${sessionIdArray[i]} EOS -> ${aSession.data.postct.eos}`);
            }

        }
    }

    catch (err) {
        console.log("doYourthing() somehow failed! ->", err)
    }

}



doYourthing();

function handleFailure(err, driver) {
    console.error('Something went wrong!\n', err.stack, '\n');
    driver.quit();
}

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
// async function wakeServerUp(sleepingServer) {

//     return new Promise((resolve, reject) => {
//         axios.get(sleepingServer)
//             .then(resolve(true))
//             .catch(error => {
//                 reject(error);
//             });
//     })

// }

function sendTest(caps, testId) {

    return new Promise(async (resolve, reject) => {

        try {

            driver = new webdriver.Builder()
                .usingServer(cbtHub)
                .withCapabilities(caps)
                .build();

            console.log("Hitting CBT with testId->", testId);

            // console.log("caps->" + JSON.stringify(caps));

            await driver.get(urlToTest);

            let taskFinishedElement = await driver.findElement(By.id('taskFinished'));

            // await driver.wait(until.elementTextIs(driver.wait(until.elementLocated(buttonLogin)), 'Sign Up'), 80000);

            await driver.wait(until.elementTextIs(taskFinishedElement, "TASK FINISHED."));

            // driver.manage().logs().get(logging.Type.BROWSER)
            // .then(function(entries) {
            //    entries.forEach(function(entry) {
            //      console.log('[%s] %s', entry.level.name, entry.message);
            //    });
            // });

            // await driver.getTitle().then(function (title) {
            //     console.log("The title is: " + title)
            // });

            await driver.quit()

            resolve(true);
        }
        catch (e) {
            handleFailure(e, driver);
            reject(false);
        }

    })

}