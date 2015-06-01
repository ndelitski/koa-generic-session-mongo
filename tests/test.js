'use strict';

import {MongoClient} from 'mongodb';
import MongoStore from '../src/store';
import thunkify from 'thunkify';

const clone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const describeStore = (msg, storeOptions, options={}) => {
  const {cleanDb=false} = options;
  let store;

  describe(msg, function() {
    const sess = {cookie: {maxAge: 2000}, name: 'name'};

    before(function (done) {
      store = new MongoStore(typeof storeOptions === 'function' ? storeOptions() : storeOptions)
        .on('connect', function (conn) {
          cleanDb && conn.db.dropDatabase();
          done();
        })
        .on('error', done);
    });

    it('should save session to db', function *() {
      const result = yield store.set('123', clone(sess));
      //noinspection BadExpressionStatementJS
      expect(result).to.be.ok;
    });

    it('should return saved session', function *() {
      const result = yield store.get('123');
      expect(result).to.deep.equal(sess);
    });

    it('should destroy session', function *() {
      yield store.destroy('123');
      const result = yield store.get('123');
      //noinspection BadExpressionStatementJS
      expect(result).to.not.ok;
    });
  });
};

describeStore('store from url', {url: 'mongodb://127.0.0.1:27017/test'}, {cleanDb: true});

describe('test auth', function() {
  let db;

  before(function *() {
      db = yield thunkify(MongoClient.connect)('mongodb://127.0.0.1:27017/testauth');
  });

  it('should add user', function *() {
    yield thunkify.call(db, db.removeUser)('han');
    let user = yield thunkify.call(db, db.addUser)('han', 'solo');
  });

  describeStore('store from db object', () => {return {db}}, {cleanDb: true});

  //todo not working for me
  //describeStore('auth store', {user: 'han', password: 'solo', db: 'testauth'});
});
