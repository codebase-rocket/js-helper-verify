// Info: Boilerplate library. Contains functions related to Generation & validation of verification codes
'use strict';

// Shared Dependencies (Managed by Loader)
var Lib = {};

// Private Dependencies - Parts of same library (Managed by Loader)
var VerifyInput;
var VerifyData;

// Exclusive Dependencies
var CONFIG = require('./config'); // Loader can override it with Custom-Config


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations

  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs

  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Must be loaded in memory already)
    Lib.Utils = shared_libs.Utils;
    Lib.Debug = shared_libs.Debug;
    Lib.Crypto = shared_libs.Crypto;
    Lib.Instance = shared_libs.Instance;
    Lib.DynamoDB = shared_libs.DynamoDB;

    // Override default configuration
    if( !Lib.Utils.isNullOrUndefined(config) ){
      Object.assign(CONFIG, config); // Merge custom configuration with defaults
    }

    // Private Dependencies
    VerifyInput = require('./verify_input')(Lib, CONFIG);
    VerifyData = require('./verify_data')(Lib, CONFIG);

  };

//////////////////////////// Module-Loader END /////////////////////////////////



///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return [Verify, VerifyInput, VerifyData];

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START///////////////////////////////
const Verify = { // Public functions accessible by other modules

  /********************************************************************
  Generate Validation code
  (Service-code makes sure that Verification-code generated for Change-Phone cannot be used for Login-Phone)

  @param {reference} instance - Request Instance object reference
  @param {requestCallback} cb - Callback function

  @param {String} namespace_entity_type - Namespace Entity-Type
  @param {String} namespace_entity_id - Namespace Entity-ID
  @param {String} service_code - Service for which this code is to be generated (register-phone | login-phone | change-phone | register-email | ...)
  @param {String} communication_id - Phone Number with Country Code | Email ID
  @param {Integer} code_length - Number of characters in verification code
  @param {Integer} cooldown_period - Cooldown period in seconds
  @param {String} code_ttl - Life span (expiry) of this verification code

  @return - Thru Callback

  @callback(err, response) - Request Callback.
  * @callback {Error} err - Verification Database Error
  * @callback {String} verification_code - Verification Code
  *********************************************************************/
  createVerificationCode: function(
    instance, cb,
    namespace_entity_type, namespace_entity_id, service_code, communication_id,
    code_length, cooldown_period, code_ttl
  ){

    // Create Verification Data
    const verification_data = VerifyData.createVerificationData(
      _Verify.createPartitionId( namespace_entity_type, namespace_entity_id ), // Partition ID
      _Verify.createVerificationId( service_code, communication_id ), // Verification ID
      _Verify.generateVerificationCode( code_length ), // Generate New Verification Code
      instance['time'], // Time of Creation
      instance['time'] + code_ttl, // Time of Expiration
    );


    // Check if an existing Verification-code is already generated (Actor cannot generate another code before minimum wait time)
    _Verify.checkVerificationCooldownInDynamoDb(
      instance,
      function(err, is_available){

        if(err){ // Validation-Database Error
          return cb(err); // Invoke callback and forward error
        }


        // If still under cooldown period
        if( !is_available ){
          return cb(null, false);
        }


        // Reach here means all good

        // Save verification data in database
        _Verify.setVerificationDataInDynamoDb(
          instance,
          function(err){

            if(err){ // Validation-Database Error
              return cb(err); // Invoke callback and forward error
            }


            // Reach here means all good
            return cb( null, verification_data['verification_code'] ); // Return verification code thru callback

          },
          verification_data // Data to be saved in database
        )

      },
      verification_data['partition_id'],
      verification_data['verification_id'],
      cooldown_period
    );

  },


  /********************************************************************
  Validate verification-code

  @param {reference} instance - Request Instance object reference
  @param {requestCallback} cb - Callback function

  @param {String} namespace_entity_type - Namespace Entity-Type
  @param {String} namespace_entity_id - Namespace Entity-ID
  @param {String} service_code - Service for which this code is to be generated (register-phone | login-phone | change-phone | register-email | ...)
  @param {String} communication_id - Phone Number with Country Code | Email ID
  @param {String} verification_code - Verification Code to be checked

  @return - Thru Callback

  @callback(err, response) - Request Callback.
  * @callback {Error} err - Verification Database Error
  * @callback {Boolean} is_valid - true if mfa code found and matched
  * @callback {Boolean} is_valid - false if mfa code didn't found or didn't match
  *********************************************************************/
  checkVerificationCode: function(
    instance, cb,
    namespace_entity_type, namespace_entity_id, service_code, communication_id,
    verification_code
  ){

    // Partition ID
    const partition_id = _Verify.createPartitionId( namespace_entity_type, namespace_entity_id );

    // Verification ID
    const verification_id = _Verify.createVerificationId( service_code, communication_id );


    // Check Verification-code. Remove-code and return true if valid. Increment fail-count and return false if invalid.
    _Verify.consumeVerificationCodeFromDynamoDb(
      instance,
      function(err, is_success){

        if(err){ // Validation-Database Error
          return cb(err); // Invoke callback and forward error
        }


        // If code did not match or not found in database
        if( !is_success ){
          return cb(null, false); // Invalid code
        }


        // Reach here means all good
        return cb(null, true);

      },
      partition_id,
      verification_id,
      verification_code
    );

  },

};///////////////////////////Public Functions END///////////////////////////////



//////////////////////////Private Functions START///////////////////////////////
const _Verify = { // Private functions accessible within this modules only

  /********************************************************************
  Consume verification-code from database at DynamoDB
  (If code is found in database, delete it to avoid reuse)
  (If code is wrong in database, increment the fail-count.)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} partition_id - Root Partition namespace
  @param {String} verification_id - ID to which this verification belongs to
  @param {String} verification_code - Unique 'code' for Specific ID

  @return Thru request Callback

  @callback - Request Callback
  * @callback {Error} err - Session not found or Unable to reach session database
  * @callback {Boolean} is_success - true if 'code' matched for this 'id'
  * @callback {Boolean} is_success - False if 'code' not found against this 'id'
  *********************************************************************/
  consumeVerificationCodeFromDynamoDb: function(
    instance, cb,
    partition_id, verification_id, verification_code
  ){

    // NO-DB Record ID
    var record_id = {
      'p': partition_id,
      'id': verification_id
    };

    // Get data from dynamodb
    Lib.DynamoDB.getRecord(
      instance,
      function(err, verification_data){ // Callback function

        if(err){ // Verification Database Error
          return cb(err); // Stop Execution. Invoke callback with error
        }


        // Record not found
        if( !verification_data ){
          return cb(null, false); // Verification Code not found
        }


        // Record Found - But Code is expired or reached max fail count
        if(
          (instance['time']-verification_data['toe']) > 0 || // Code has expired
          verification_data['fc'] >= CONFIG.CODE_FAIL_MAX_COUNT // Reached maximum allowed failed count
        ){
          return cb(null, false); // Verification Code is not acceptable
        }


        // Record Found - But Code does not match
        if(
          verification_data['code'] !== verification_code // Code didn't match
        ){

          // Increment failed count and then return response to callback
          Lib.DynamoDB.updateRecord(
            instance,
            function(err, response){

              // No error check. Ignore error since this is not a primary DB call

              // Return
              return cb(null, false); // Verification Code did not match

            },
            CONFIG.DB_SOURCE, // Table Name
            record_id, // Record ID for fetching data
            null, // No updated data
            null, // No keys to remove
            { // Increments
              'fc': 1, // Increment by 1
            }
          );

        }

        // Code Matched. Return true and delete this code as it's consumed
        else{

          // Return success to callback
          cb(null, true);


          // Create a background process in 'instance'
          const background_function_cleanup = Lib.Instance.backgroundRoutine(instance);

          // Delete this record (in background)
          Lib.DynamoDB.deleteRecord(
            instance,
            function(err, is_success){

              // Since it's a background process, do nothing in case of error. Do nothing with response.

              // Background function finished
              background_function_cleanup(instance);

            },
            CONFIG.DB_SOURCE, // Table Name
            record_id // Record ID for fetching data
          )

        }

      },
      CONFIG.DB_SOURCE, // Table Name
      record_id // Record ID for fetching data
    );

  },


  /********************************************************************
  Add/Update(over-write) Item in verification-databse

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Map} verification_data - Verification data that needs to be saved in database

  @return Thru request Callback.

  @callback - Request Callback. No Response, only error
  * @callback {Error} err - Unable to reach varification database
  *********************************************************************/
  setVerificationDataInDynamoDb: function(instance, cb, verification_data){

    // Create Verification Record Object that is to be saved in Database
    const db_record = {
      'p': verification_data['partition_id'],
      'id': verification_data['verification_id'],
      'code': verification_data['verification_code'],
      'fc': 0, // Fixed. Initalize with 0 failed attempts
      'toc': verification_data['time_of_creation'],
      'toe': verification_data['time_of_expiry'],
    };


    // Get data from dynamodb
    Lib.DynamoDB.addRecord(
      instance,
      function(err, is_success){ // Callback function

        if(err){ // Session Database Error
          return cb(err); // Invoke callback with error
        }

        if(!is_success){ // Session Database Error
          return cb(Error(CONFIG.DATABASE_WRITE_FAILED)); // Invoke callback with error
        }

        // Invoke callback without any error
        cb(null);

      },
      CONFIG.DB_SOURCE, // Table Name
      db_record // Record to be saved in database
    );

  },


  /********************************************************************
  Check for waitdown period before another verification code can be generated

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} partition_id - Root Partition namespace
  @param {String} verification_id - ID to which this verification belongs to

  @param {Integer} cooldown_period - Cooldown period in seconds

  @return Thru request Callback.

  @callback - Request Callback. No Response, only error
  * @callback {Error} err - Unable to reach varification database
  * @callback {Boolean} is_available - true (New code can be generated since no past code generated within cooldown period)
  * @callback {Boolean} is_available - false (another code was generated within cooldown period)
  *********************************************************************/
  checkVerificationCooldownInDynamoDb: function(
    instance, cb, partition_id, verification_id, cooldown_period
  ){

    // NO-DB Record ID
    var record_id = {
      'p': partition_id,
      'id': verification_id
    };

    // Get data from dynamodb
    Lib.DynamoDB.getRecord(
      instance,
      function(err, verification_data){ // Callback function

        if(err){ // Verification Database Error
          return cb(err); // Stop Execution. Invoke callback with error
        }


        // Record Found and Code was generated before colldown period
        if(
          verification_data && // Record found
          cooldown_period > (instance['time']-verification_data['toc']) // Still under cooldown period
        ){
          return cb(null, false); // Another code cannot be generated
        }


        // Reach here means all good

        // Return success to callback
        cb(null, true);

      },
      CONFIG.DB_SOURCE, // Table Name
      record_id // Record ID for fetching data
    );

  },


  /********************************************************************
  Create Partition ID from Entity Details

  @param {String} namespace_entity_type - Namespace Entity-Type
  @param {String} namespace_entity_id - Namespace Entity-ID

  @return {String} - Partition-ID (EntityType.EntityID)
  *********************************************************************/
  createPartitionId: function(namespace_entity_type, namespace_entity_id){

    // Partition ID
    return (namespace_entity_type + '.' + namespace_entity_id)

  },


  /********************************************************************
  Create Verification ID from Entity Details

  @param {String} service_code - Service for which this code is to be generated (register-phone | login-phone | change-phone)
  @param {String} communication_id - Phone Number with Country Code | Email ID

  @return {String} - Verification-ID (EntityType.EntityID)
  *********************************************************************/
  createVerificationId: function(service_code, communication_id){

    // Verification ID
    return (service_code + '.' + communication_id)

  },


  /********************************************************************
  Generate Random Auth-Key

  @param {Integer} code_length - Number of characters in verification code

  @return {String} - Verification Code
  *********************************************************************/
  generateVerificationCode: function(code_length){

    return Lib.Crypto.generateRandomString(CONFIG.CODE_CHARSET, code_length); // Generate random string

  },

};/////////////////////////Private Functions END////////////////////////////////
