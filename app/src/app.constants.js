const USER_ROLES = ['USER', 'MANGAER', 'ADMIN', 'SUPERADMIN'];
const STATUS = ['pending', 'saved', 'failed'];
const INCLUDES = ['widget', 'layer', 'vocabulary', 'metadata'];
const CONNECTOR_TYPES = {
    rest: {
        provider: ['cartodb', 'featureservice', 'gee']
    },
    document: {
        provider: ['csv', 'json', 'tsv', 'xml']
    },
    wms: {
        provider: ['wms']
    }
};

module.exports = {
    USER_ROLES,
    STATUS,
    INCLUDES,
    CONNECTOR_TYPES,
};