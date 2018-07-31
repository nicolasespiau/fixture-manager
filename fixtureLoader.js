'use strict';

module.exports = class FixtureLoader {
  constructor(db) {
    this.db = db;
  }

  /**
   * Accessor to objects:
   * return the object at index i or the full list if i not given
   * @param name Object name
   * @param i Object index in local storage
   * @returns {*}
   */
  get(name, i = false) {
    if (i === false) {
      return this[name];
    } else {
      return this[name][i];
    }
  }

  /**
   * Load given fixtures in db
   * Store fixtures in local var
   * Backup related collection if necessary
   *
   * @param path path to objects files
   * @param objects
   * @returns {Promise<void>}
   */
  async load(path, objects) {
    //create list of backup collections
    this.backupCollections = [];
    //create list of objects
    this.objects = {};
    //init or get Db and MongoClient
    //load all objects
    await Promise.all(objects.map(async (object) => {
      //get corresponding file
      const objectData = require(path + object);
      //open mongo Collection
      const objectCol = this.db.collection(objectData.collection);

      //try to backup
      const hadToBackup = await this.constructor.backupCollection(objectCol);
      //if backup was  necessary then push collection's name into list of backup collections
      if (hadToBackup) {
        this.backupCollections.push(objectData.collection);
      }
      //store fixtures into local var
      this[objectData.collection] = objectData.objects.slice();

      //insert objects into db
      if (objectData.objects.length > 0) {
        await objectCol.insertMany(objectData.objects);
      }
    }));
  }

  /**
   * Rename given collection into `collectionName_backup` if it contains documents, do nothing otherwise
   *
   * @param collection MongoCollection
   * @returns {Promise<boolean>} Return true if the backup has to be done, false otherwise
   * @throws MongoException
   */
  static async backupCollection(collection) {
    const docCount = await collection.count();
    if (docCount === 0) {
      return false;
    }

    await collection.rename(collection.collectionName + "_backup", {dropTarget: true});
    return true;
  }

  /**
   * Loops over backup collections and restore them
   * @returns {Promise<void>}
   * @throws MongoException
   */
  async restore() {
    //iterate through backup collection's names and restore them
    await Promise.all(this.backupCollections.map(async (collectionName) => {
      const backupCollection = this.db.collection(collectionName + "_backup");
      await backupCollection.rename(collectionName, {dropTarget: true});
    }));
  }
};