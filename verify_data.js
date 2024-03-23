// Info: Contains Functions Related to Verification-code Data-Structures
'use strict';

// Shared Dependencies (Managed by Main Entry Module & Loader)
var Lib;

// Exclusive Dependencies
var CONFIG; // (Managed by Main Entry Module & Loader)


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations

  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs

  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Managed my Main Entry Module)
    Lib = shared_libs;

    // Configuration (Managed my Main Entry Module)
    CONFIG = config;

  };

//////////////////////////// Module-Loader END /////////////////////////////////



///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return VerifyData;

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START///////////////////////////////
const VerifyData = { // Public functions accessible by other modules

  /********************************************************************
  Return a verification-Data object

  @param {String} partition_id - Root Partition namespace
  @param {String} verification_id - ID to which this verification belongs to
  @param {String} verification_code - Unique 'code' for Specific ID
  @param {Integer} time_of_creation - Time of Creation of verification code (Unix Time)
  @param {Integer} time_of_expiry - Time of Expiration of verification code (Unix Time)

  @return {Map} - Verification-Data Object in key-value
  *********************************************************************/
  createVerificationData: function(
    partition_id, verification_id, verification_code,
    time_of_creation, time_of_expiry
  ){

    return {
      'partition_id'          : partition_id,
      'verification_id'       : verification_id,
      'verification_code'     : verification_code,
      'time_of_creation'      : time_of_creation,
      'time_of_expiry'        : time_of_expiry
    };

  },

};///////////////////////////Public Functions END///////////////////////////////



//////////////////////////Private Functions START///////////////////////////////
const _Verify = { // Private functions accessible within this modules only
  // None
};/////////////////////////Private Functions END////////////////////////////////
