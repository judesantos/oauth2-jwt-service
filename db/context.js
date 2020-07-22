const debug = require('debug')('yourtechy-oauth2:dbcontext')
const connector = require('./connector')
const env = require('../env')
const { resolve } = require('path')

let dbConnections = {}

const DbContext = {
  useDb: (name) => {
    return dbConnections[name];
  },
  addDb: async (name, opts) => {
    const cnx = await connector.connect(
      opts.url,
      name,
      env.isProduction,
    ).then((cnx) => {
      // add db to our local cache
      dbConnections[name] = cnx
      debug(name + ' connection successful!')
      return true
    }).catch(err => {
      debug(name + ' connection attempt failed: ')
      debug(err)
      return false
    })
  },
  init: async () => {
    /**
     * fetch from config - load and connect to each db defined in config
     *
     * Ex. Config:
     *  mongodb: {
     *    db1: {
     *      url: 'mongodb://db1',
     *    },
     *    db2: {
     *      url: 'mongodb://db2' ,
     *    }
     *  }
     **/
    const configs = env.mongoDb
    for (const name in configs) {
      await DbContext.addDb(name, configs[name])
    }
    return true
  }
}

module.exports = DbContext
