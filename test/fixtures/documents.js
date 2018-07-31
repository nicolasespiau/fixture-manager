'use strict';

const ObjectId = require('mongodb').ObjectId;

module.exports = {
  collection: "foocollection",
  objects: [
    {
      _id: ObjectId(),
      uniqueField: "fpvf4e3a",
      name: "ThisIsMyName",
      version: 3
    },
    {
      _id: ObjectId(),
      uniqueField: "qs5gf6re",
      username: "John",
      email: "john@gmail.com",
      version: 2
    },
    {
      _id: ObjectId(),
      uniqueField: "fj5e91ca",
      topElement: "randomtag",
      width: "100px",
      position: "relative",
      parent: "body"
    }
  ]
};