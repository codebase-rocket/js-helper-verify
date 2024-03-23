// Info: Test Cases
'use strict';

// Shared Dependencies
var Lib = {};

// Set Configrations
const nodb_config = { // Config AWS DynamoDB
  'KEY': 'todo',
  'SECRET': 'todo',
  'REGION': 'us-east-1'
};
const verify_config = { // Config Verify
  'DB_SOURCE': 'test_verification'
};

// Dependencies
Lib.Utils = require('js-helper-utils');
Lib.Debug = require('js-helper-debug')(Lib);
Lib.Crypto = require('js-helper-crypto-nodejs')(Lib);
Lib.Instance = require('js-helper-instance')(Lib);
Lib.NoDB = require('js-helper-aws-dynamodb')(Lib, nodb_config);
const [ Verify, VerifyInput, VerifyData ] = require('js-helper-verify')(Lib, verify_config);


////////////////////////////SIMILUTATIONS//////////////////////////////////////

function test_output_createVerificationCode(err, verification_code){ // Result are from previous function

  if(err){ // If error
    Lib.Debug.log('createVerificationCode err:', JSON.stringify(err) );
  }
  else{
    Lib.Debug.log('verification_code:', verification_code );
    public_verification_code = verification_code;
    test_checkVerificationCode();
  }

};


function test_output_checkVerificationCode(err, is_valid){ // Result are from previous function

  if(err){ // If error
    Lib.Debug.log('checkVerificationCode err:', JSON.stringify(err) );
  }
  else{
    Lib.Debug.log('is_valid:', is_valid );
  }

};

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////STAGE SETUP///////////////////////////////////////

// Initialize 'instance'
var instance = Lib.Instance.initialize();


// Dummy data
var entity_type = 'acme';
var entity_id = 'abc';
var service_code = 'login-phone';
var communication_id = '+919999999999';
var code_length = 4; // 4 Characters
var cooldown_period = 60; // 1 Minute
var code_ttl = 300; // 5 Minutes


// public access to verification_code
var public_verification_code = '';

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////////TESTS/////////////////////////////////////////

// Test .createVerificationCode() function
Verify.createVerificationCode(
  instance,
  test_output_createVerificationCode,
  entity_type,
  entity_id,
  service_code,
  communication_id,
  code_length,
  cooldown_period,
  code_ttl
);


// Test .checkVerificationCode()
var test_checkVerificationCode = function(){
  Verify.checkVerificationCode(
    instance,
    test_output_checkVerificationCode,
    entity_type,
    entity_id,
    service_code,
    communication_id,
    public_verification_code
  );
}
