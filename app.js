require('dotenv').config()

"use strict";
var webdriver = require("selenium-webdriver");
 
var cbtHub = "http://hub.CrossBrowserTesting.com:80/wd/hub";

var username =process.env.CBTUSERNAME; 
var authkey = process.env.AUTHKEY; 
let urlToTest = process.env.TESTPAGE


var caps = {
    name : 'Basic Test Example',
    build : '1.0',
    version : '70',
    platform : 'Windows 10',
    screen_resolution : '1366x768',
    record_video : 'true',
    record_network : 'false',
    browserName : 'Chrome',
    username : username,
    password : authkey
};


async function basicExample(){
    try{
        
        console.log("Reaching test page via CBT...")
        var driver = new webdriver.Builder()
            .usingServer(cbtHub)
            .withCapabilities(caps)
            .build();


        await driver.get(urlToTest);

        await driver.getTitle().then(function(title) {
                    console.log("The title is: " + title)
            });

        driver.quit();
    }

    catch(err){
        handleFailure(err, driver)
    }

}

basicExample();

function handleFailure(err, driver) {
     console.error('Something went wrong!\n', err.stack, '\n');
     driver.quit();
}