const { mongo } = require('mongoose')

const mongoose = require('mongoose').Mongoose

const connector = {

  connect: (async (url, name, isProduction = false) => {
    let db = null

    try {
      const instance = new mongoose() // supports multiple db instance

      db = await instance.connect(url, {
        useCreateIndex: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        connectTimeoutMS: 10000,
        keepAlive: true,
        dbName: name
      })

      if (!isProduction) {
        instance.set('debug', true)
      }

    } catch (exc) {
      throw exc
    }

    return db
  })
}

module.exports = connector
