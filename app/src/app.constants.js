const USER_ROLES = ['USER', 'MANGAER', 'ADMIN', 'SUPERADMIN'];
const STATUS = ['pending', 'saved', 'failed'];
const INCLUDES = ['widget', 'layer', 'vocabulary', 'metadata'];
const PROVIDERS = {
    rest: {
        connectorType: ['cartodb', 'featureservice', 'gee']
    },
    document: {
        connectorType: ['csv', 'json', 'tsv', 'xml']
    },
    wms: {
        connectorType: ['wms']
    }
};

module.exports = {
    USER_ROLES,
    STATUS,
    INCLUDES,
    PROVIDERS,
};
