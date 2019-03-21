const { CONNECTOR_TYPES } = require('app.constants');
const { ROLES } = require('./test.constants');


function isArray(element) {
    if (element instanceof Array) {
        return true;
    }
    return false;
}

function isObject(property) {
    if (property instanceof Object && property.length === undefined) {
        return true;
    }
    return false;
}

const deserializeDataset = (response) => {
    if (isArray(response.body.data)) {
        return response.body.data;
    }
    if (isObject(response.body.data)) {
        return response.body.data.attributes;
    }
    return response;
};

const getUUID = () => Math.random().toString(36).substring(7);

const createDataset = (provider) => {
    let connectorType = '';

    // CONNECTOR_TYPES.{keys, values, entries};
    Object.keys(CONNECTOR_TYPES).forEach((tempConnectorType) => {
        if (CONNECTOR_TYPES[tempConnectorType].provider.includes(provider)) {
            connectorType = tempConnectorType;
        }
    });

    if (connectorType === '') {
        throw Error(`Attempted to create dataset with invalid provider type: ${provider}`);
    }

    const uuid = getUUID();

    return {
        name: `Fake dataset ${uuid}`,
        slug: `fake-carto-${uuid}`,
        type: null,
        subtitle: `Fake dataset ${uuid} subtitle`,
        dataPath: `Fake dataset ${uuid} data path`,
        application: 'rw',
        attributesPath: `Fake dataset ${uuid} attributes path`,
        connectorType,
        dataLastUpdated: (new Date().toISOString()),
        sourceApplication: `Fake dataset ${uuid} source application`,
        sourceLanguage: 'en',
        provider,
        userId: ROLES.ADMIN.id,
        env: 'production',
        geoInfo: false,
        connectorUrl: `Fake dataset ${uuid} connector URL`,
        tableName: `Fake dataset ${uuid} table name`,
        overwrite: true,
        status: 'saved',
        sandbox: true,
        published: true
    };
};

const mapDatasetToMetadataSearchResult = dataset => ({
    id: getUUID(),
    type: 'metadata',
    attributes: {
        dataset: dataset._id,
        application: dataset.application[0],
        resource: {},
        language: 'en',
        name: dataset.name,
        description: dataset.description,
        license: 'Other',
        info: {
            foo: 'bar'
        },
        createdAt: '2018-07-17T16:32:45.315Z',
        updatedAt: '2018-07-17T16:32:45.315Z',
        status: 'published'
    }
});

module.exports = {
    createDataset,
    deserializeDataset,
    mapDatasetToMetadataSearchResult,
    getUUID
};
