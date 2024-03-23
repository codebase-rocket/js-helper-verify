# v1.0 #

------------
AWS DynamoDB
------------


--------------------------------
Create table - Verification Code
--------------------------------
Verification Codes

* Table Name: verification
* Partition Key: p [string]
* Sort Key: id [string]

* Secondary Index: [NONE]
* Read/write capacity mode: On-demand

* After Table is Created-
* Overview -> Table details -> Time to live attribute -> Manage TTL
  * Time to live attribute: toe

Table Structure
---------------
* p (String)          -> [Partition Key] Entity-Type + '.' + Entity-ID on which this action is performed (Store-ID/Org-ID/Menu-ID/...)
* id (String)         -> [Sort Key] {Service ID ('change-phone'|'login-phone'|...)} + {module-specific-id} + {Phone Number with Country Code | Email-id}
* code (String)       -> Unique code for this ID
* fc (String)         -> Fail Count (Number of times wrong code was sent)
* toc (Number)        -> Time of Creation (Unix Time)
* toe (Number)        -> Time of Expiration (Unix Time) (Record will auto expire after this time)
