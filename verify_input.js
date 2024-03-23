// Info: Contains Functions Related to Verification-Code Cleanup and Validations
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
  return VerifyInput;

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START///////////////////////////////
const VerifyInput = { // Public functions accessible by other modules

  /********************************************************************
  Return cleaned Verification-Code for non-sql purposes
  Remove all the dangerous characters excluding those who satisfy RegExp

  @param {String} verification_code - Verification Code to be cleaned

  @return {String} - Sanitized string
  *********************************************************************/
  sanitizeVerificationCode: function(verification_code){

    // Clean and return
    return Lib.Utils.sanitizeUsingRegx(verification_code, CONFIG.CODE_SANATIZE_REGX);

  },

};///////////////////////////Public Functions END///////////////////////////////



//////////////////////////Private Functions START///////////////////////////////
const _VerifyInput = { // Private functions accessible within this modules only
  // None
};/////////////////////////Private Functions END////////////////////////////////
