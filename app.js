require('dotenv').config()
const axios = require('axios');
let capsArray = require('./browsers.all.cbt.json')

"use strict";
var webdriver = require("selenium-webdriver");

var cbtHub = "http://hub.CrossBrowserTesting.com:80/wd/hub";

var username = process.env.CBTUSERNAME;
var authkey = process.env.CBTAUTHKEY;
let urlToTest = process.env.TESTPAGE
const testId = new Date().getTime();

urlToTest += `?testId=${testId}`


var basicCapInfo = {
    name: 'Vernon Test',
    build: '1.0',
    record_video: 'true',
    record_network: 'false',
    username: username,
    password: authkey
};

async function doYourthing() {
    try {

        console.log("Waking the servers up...")

        await wakeServerUp('https://backend.vernon.net.ar/');

        await wakeServerUp(urlToTest);

        for (let i = 0; i < capsArray.length; i++) {

            caps = { ...basicCapInfo, ...capsArray[i] };

            console.log("caps->" + JSON.stringify(caps))

            await sendTest(caps, testId);

        }


        let testResults = await getTestResults(testId);

        console.log("testResults->" + testResults)

        let howManyEntries = parseInt(testResults.substr(8, testResults.length));

        console.log(`${capsArray.length} tests expected, got ${howManyEntries}.`)

        if (howManyEntries == capsArray.length) {

            console.log(`ALL GOOD :D`)

            process.exitCode = 0

        }

        else {
            process.exitCode = 1
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
        axios.get(`https://backend.vernon.net.ar/results?testId=${testId}`)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error);
            });
    })

}
async function wakeServerUp(sleepingServer) {

    return new Promise((resolve, reject) => {
        axios.get(sleepingServer)
            .then(resolve(true))
            .catch(error => {
                reject(error);
            });
    })

}

function sendTest(caps, testId) {

    return new Promise(async (resolve, reject) => {

        try {

            let driver = new webdriver.Builder()
                .usingServer(cbtHub)
                .withCapabilities(caps)
                .build();

            console.log("Hitting CBT with testId->", testId)

            // console.log("caps->" + JSON.stringify(caps));

            await driver.get(urlToTest);

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