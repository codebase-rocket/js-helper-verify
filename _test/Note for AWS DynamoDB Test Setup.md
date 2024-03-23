------------
Create Table
------------
Test table for Verification Codes

* Table Name: test_verification
* Partition Key: p [string]
* Sort Key: id [string]

* Secondary Index: [NONE]
* Provisioned capacity: [Default]

* After Table is Created-
* Overview -> Table details -> Time to live attribute -> Manage TTL
    * Time to live attribute: toe

Table Structure
---------------
* p (String)          ->	[Partition Key] Entity-Type + '.' + Entity-ID on which this action is performed (Store-ID/Org-ID/Menu-ID/...)
* id (String)         ->	[Sort Key] {Service ID ('change-phone'|'login-phone'|...)} + {module-specific-id} + {Phone Number with Country Code | Email-id}
* code (String)       ->	Unique code for this ID
* toc (Number)		    ->	Time of Creation (Unix Time)
* toe (Number)		    ->	Time of Expiration (Unix Time) (Record will auto expire after this time)



-----------------
Create IAM policy
-----------------
* Create Your Own Policy -> Select 'JSON'
* Name: `test-policy-verify`
* Description: Test policy for dynamodb verify table
* Policy Document:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUserToAccessVerificationTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:UpdateTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/test_verification"
    }
  ]
}
```



---------------
Create IAM User
---------------
* Name: `test-user`
* Access type: Programmatic access
* Attach existing policies directly: `test-policy-verify`
* Note down AWS Key and Secret
