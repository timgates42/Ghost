const adapterManager = require('../../../server/services/adapter-manager');
const config = require('../../../shared/config');

let getHelperCache;
if (config.get('hostSettings:getHelperCache:enabled')) {
    getHelperCache = adapterManager.getAdapter('cache:getHelper');
}

module.exports = getHelperCache;
