module.exports = {
    isProduction: false || process.env.isProduction,
    serverPort: 8888,
    mongoDb: {
        oauth: {
            url: 'mongodb://localhost:27017/oauth' || process.env.mongoDb.oauthUrl,
            name: 'oauth'
        },
        app: {
            url: 'mongodb://localhost:27017/app' || process.env.mongoDb.appUrl,
            name: 'app'
        }
    },
    salt: 'asfkjsl324023423sljslfjwe0r920394sf98' || process.env.salt,
    jwt: {
        access_token_expires: 3600 || process.env.jwt_access_token_expires,
        refresh_token_expires: 1209600 || process.env.jwt_refresh_token_expires,
        issuer: 'yourtechy-OAuth2-jwt',
        algorithm: 'RS256'
    },
    logging: {
        logLevel: "debug" || process.env.logLevel,
        errorLogPath: './logs/error.log',
        commonLogPath: './logs/activity.log'
    }
};
