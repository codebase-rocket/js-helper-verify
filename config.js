// Info: Configuration file
'use strict';


// Export configration as key-value Map
module.exports = {

  // Constraints on Verification Code
  CODE_CHARSET          : `0123456789`,         // Valid charset. Only Digits
  CODE_SANATIZE_REGX    : /[^0-9]/gi,           // Regular expression for valid Characters. Only digits. Case Insensitive


  // Number of failed codes allowed
  CODE_FAIL_MAX_COUNT   : 3,                    // Max number of wrong codes allowed before auto deactivation of verification-code


  // Database Table Name
  DB_SOURCE             : 'verification_code',


  // Error Codes
  DATABASE_WRITE_FAILED : {
    CODE: 'DATABASE_WRITE_FAILED',
    MESSAGE: 'Faied to write into verification database'
  },

};
