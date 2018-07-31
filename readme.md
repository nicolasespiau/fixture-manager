# FIXTURE MANAGER

## Purpose

This module provides a Fixture Loader class designed to manage fixtures easily: backuping collections, loading fixtures, restoring data.

##  Quick start

```javascript
const MongoClient = require('mongodb').MongoClient;
const Mclient = new MongoClient(SERVER, OPTIONS).connect();
const MDB = Mclient.db(DBNAME);

const fixtureLoaderClass = require('@bonjourjohn/fixture-manager');
const fixtureLoader = new fixtureLoaderClass(MDB);

//load fixtures, execute before test script
await fixtureLoader.load(__dirname + '/fixtures/', ["bikers", "old_ladies"]);

//access objects in loader
fixtureLoader.get("foo", 0); //get the first foo object in list
fixtureLoader.get("bar"); //get the while bar list

//restore, execute after test script
await fixtureLoader.restore();
```

## Usage

### Fixtures files

Your fixtures must be stored in files following this structure:

```javascript
'use strict';

let ObjectId = require('mongodb').ObjectId; //only if you need to set id and access it from your tests

_structure:_
module.exports = {
  "collection": "bikers",
  "objects": [
    {
      "_id": ObjectId(),
      "field1": "Jackson",
      "field2": "Teller",
      ...
    },
    ...
  ]
}
```

_example file: bikers.js_
```javascript
'use strict';

let ObjectId = require('mongodb').ObjectId; //only if you need to set id and access it from your tests


module.exports = {
  "collection": "bikers",
  "objects": [
    {
      "_id": ObjectId(),
      "firstname": "Jackson",
      "lastname": "Teller",
      "email": "jax@samcro.org"
    },
    {
      "_id": ObjectId(),
      "firstname": "Clay",
      "lastname": "Morrow",
      "email": "clay@soamc.com"
    }
  ]
}
```

_example file: old_ladies.js_
```javascript
'use strict';

let ObjectId = require('mongodb').ObjectId; //only if you need to set id and access it from your tests


module.exports = {
  "collection": "wives",
  "objects": [
    {
      "_id": ObjectId(),
      "firstname": "Tara",
      "lastname": "Knowles",
      "email": "t.knowles@st-thomas.com"
    },
    {
      "_id": ObjectId(),
      "firstname": "Gemma",
      "lastname": "Morrow",
      "email": "gemma.morrow@tm-garaga.com"
    }
  ]
}
```

## Testing

### Requirements

You need a MongoDB and a Redis server running.

My choice is to use Docker to easy things.
I recommend these images:
 - [MongoDB](https://hub.docker.com/_/mongo/)
 - [Redis](https://hub.docker.com/_/redis/)

```shell
docker run --name database -p 27017:27017 -d mongo
docker run --name cache -p 6379:6379 -d redis:3.0.6-32bit
```

If you already have a MongoDB server and a Redis server running localy then you don't need anything from Docker and you can ignore the instructions above.

Once everything is running, just run the tests:

```shell
npm test
```
