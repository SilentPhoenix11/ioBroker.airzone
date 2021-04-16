'use strict';
//Airzone Cloud Adapter for ioBroker
//REV 0.0.1

const adaptername = "Airzone Cloud"

const utils = require('@iobroker/adapter-core');
var adapter  = utils.Adapter (adaptername);

var LOG_ALL = false;						     //Flag to activate full logging

//AIRZONE CLOUD CONNECTION values
var USERNAME  = "";							     // you're username used to connect on Airzone Cloud website or app
var PASSWORD = "";								 // you're password used to connect on Airzone Cloud website or app
var USER_AGENT = "";							 // allow to change default user agent if set
var BASE_URL = "https://www.airzonecloud.com";	 // allow to change base url of the Airzone Cloud API if set






