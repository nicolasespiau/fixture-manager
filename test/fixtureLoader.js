'use strict';

const Collection = require('mongodb').Collection;
const should = require('should');

const mongoClient = require('./libs/mongoClient');

const fixtureLoaderClass = require('../index');
let fixtureLoader;
let backupCol;
let collection;

const docs = [
  {
    uniqueField: "unique01",
    foo: "bar"
  },
  {
    uniqueField: "unique02",
    foo: "baz"
  }
];

describe("Testing fixture loader", function () {
  this.timeout(10000);

  before("Open mongo connection and create collection", function (done) {
    mongoClient.init()
      .then((db) => {

        try {
          collection = db.collection('foocollection');
        } catch (e) {
          done(e);
        }

        collection.insertMany(docs)
          .then(() => {
            fixtureLoader = new fixtureLoaderClass(db);
            done();
          })
          .catch(done);
      })
      .catch(done);
  });

  after("close connection", function (done) {
    mongoClient.connectionInstance.collections()
      .then((collections) => {
        Promise.all
        (collections.map((col) => {
            return mongoClient.connectionInstance.dropCollection(col.s.name)
          })
        )
          .then(() => {
            mongoClient.close()
              .then(done)
              .catch(done);
          })
          .catch(done);
      })
      .catch(done);
  });

  describe("Load fixtures", () => {
    before("Load", (done) => {
      fixtureLoader.load(__dirname + "/fixtures/", ["documents"])
        .then(done)
        .catch(done);
    });
    describe('Access fixtures inside fixtureLoader object', () => {
      const docu = require('./fixtures/documents');
      it('should give access to documents', () => {
        fixtureLoader.get('foocollection').should.be.instanceOf(Array).and.have.lengthOf(docu.objects.length);
      });
      it('should allow acces to one doc', () => {
        fixtureLoader.get('foocollection', 0).should.have.properties(...Object.keys(docu.objects[0]));
      });
    });
    describe("Check backup collection", () => {
      before("get backup collection", () => {
        backupCol = mongoClient.connectionInstance.collection("foocollection_backup");
      });
      it("should have created a backup collection in db", () => {
        backupCol.should.be.instanceOf(Collection);
      });
    });
    describe('Checking on backup collection documents', () => {
      let backupDocuments;
      before('get documents', (done) => {
        backupCol.find().toArray()
          .then((backupDocs) => {
            backupDocuments = backupDocs;
            done();
          })
          .catch(done);
      });
      it('should have return all docs', () => {
        backupDocuments.should.be.instanceOf(Array).and.have.lengthOf(docs.length);
      });
      describe('check the docs', () => {
        let simplifiedBackupDoc, simplifiedOriginalDocs;
        before('simplify docs to allow id comparison', () => {
          //convert ids into strings to allow comparison
          simplifiedBackupDoc = backupDocuments.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
          //convert ids into strings to allow comparison
          simplifiedOriginalDocs = docs.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
        });
        it('all original docs should be have been foudn in backup collection', () => {
          simplifiedOriginalDocs.forEach((origDoc) => {
            simplifiedBackupDoc.should.containEql(origDoc);
          });
        });
        it('all docs returned from backup collection should be found in originals', () => {
          simplifiedBackupDoc.forEach((backupDoc) => {
            simplifiedOriginalDocs.should.containEql(backupDoc);
          });
        });
      });
    });
    describe('Checking on new collection documents', () => {
      let newDocuments, fixtures;
      before('get documents from new collection', (done) => {
        fixtures = fixtureLoader.get('foocollection');
        collection.find().toArray()
          .then((newDocs) => {
            newDocuments = newDocs;
            done();
          })
          .catch(done);
      });
      it('new col should contain the right count of docs', () => {
        newDocuments.should.be.instanceOf(Array).and.have.lengthOf(fixtures.length);
      });
      describe('check the docs', () => {
        let simplifiedNewDocs, simplifiedOriginalDocs;
        before('simplify docs to allow id comparison', () => {
          //convert ids into strings to allow comparison
          simplifiedNewDocs = newDocuments.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
          //convert ids into strings to allow comparison
          simplifiedOriginalDocs = fixtures.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
        });
        it('all fixture docs should have been found in new collection', () => {
          simplifiedOriginalDocs.forEach((origDoc) => {
            simplifiedNewDocs.should.containEql(origDoc);
          });
        });
        it('all docs from new collection should be have been found in fixtures', () => {
          simplifiedNewDocs.forEach((newDoc) => {
            simplifiedOriginalDocs.should.containEql(newDoc);
          });
        });
      });
    });
  });

  describe('Restore backup', () => {
    before('Do restore', (done) => {
      fixtureLoader.restore()
        .then(done)
        .catch(done);
    });
    it('should have droped backup collection', (done) => {
      mongoClient.connectionInstance.collections()
        .then((collections) => {
          const collectionNames = collections.map((collection) => {
            return collection.s.name
          });
          collectionNames.indexOf('foocollection_backup').should.equal(-1);
          done();
        })
        .catch(done);
    });
    describe('Check restored collection', () => {
      let restoredDocuments;
      before('get documents', (done) => {
        mongoClient.connectionInstance.collection('foocollection').find().toArray()
          .then((backupDocs) => {
            restoredDocuments = backupDocs;
            done();
          })
          .catch(done);
      });
      it('backupCol should contain the right number of docs', () => {
        restoredDocuments.should.be.instanceOf(Array).and.have.lengthOf(docs.length);
      });
      describe('check the docs', () => {
        let simplifiedRestoredDocs, simplifiedOriginalDocs;
        before('simplify docs to allow id comparison', () => {
          //convert ids into strings to allow comparison
          simplifiedRestoredDocs = restoredDocuments.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
          //convert ids into strings to allow comparison
          simplifiedOriginalDocs = docs.map(
            (doc) => {
              doc._id = doc._id.toString();
              return doc;
            }
          );
        });
        it('all original docs should be found in db', () => {
          simplifiedOriginalDocs.forEach((origDoc) => {
            simplifiedRestoredDocs.should.containEql(origDoc);
          });
        });
        it('all db docs should be found in originals', () => {
          simplifiedRestoredDocs.forEach((backupDoc) => {
            simplifiedOriginalDocs.should.containEql(backupDoc);
          });
        });
      });
    });
  });
});
