const logger = require('logger');
const nock = require('nock');
const request = require('superagent').agent();
const BASE_URL = require('./test.constants').BASE_URL;
const ROLES = require('./test.constants').ROLES;
require('should');

let referencedDataset = null;

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

function deserializeDataset(response) {
    if (isArray(response.body.data)) {
        return response.body.data.map(el => el.attributes);
    } else if (isObject(response.body.data)) {
        return response.body.data.attributes;
    }
    return response;
}

describe('E2E test', () => {

    before(() => {

        // simulating gateway communications
        nock(`${process.env.CT_URL}/v1`)
            .post('/rest-datasets/gee', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        nock(`${process.env.CT_URL}/v1`)
            .post('/rest-datasets/cartodb', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        nock(`${process.env.CT_URL}/v1`)
            .post('/rest-datasets/featureservice', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        nock(`${process.env.CT_URL}/v1`)
            .post('/doc-datasets/json', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        nock(`${process.env.CT_URL}/v1`)
            .post('/doc-datasets/json', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

    });

    /* Create a Carto Dataset */
    it('Create a CARTO DB dataset', async() => {
        let response = null;
        const timestamp = new Date().getTime();
        const dataset = {
            name: `Carto DB Dataset - ${timestamp}`,
            application: ['rw'],
            connectorType: 'rest',
            provider: 'cartodb',
            env: 'production',
            connectorUrl: 'https://wri-01.carto.com/tables/wdpa_protected_areas/table',
            overwrite: true
        };
        let createdDataset = null;
        try {
            response = await request.post(`${BASE_URL}/dataset`).send({
                dataset,
                loggedUser: ROLES.ADMIN
            });
            createdDataset = deserializeDataset(response);
            referencedDataset = response.body.data;
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Object();
        createdDataset.should.have.property('name').and.be.exactly(`Carto DB Dataset - ${timestamp}`);
        createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(1);
        createdDataset.should.have.property('connectorType').and.be.exactly('rest');
        createdDataset.should.have.property('provider').and.be.exactly('cartodb');
        createdDataset.should.have.property('connectorUrl').and.be.exactly('https://wri-01.carto.com/tables/wdpa_protected_areas/table');
        createdDataset.should.have.property('tableName').and.be.exactly('wdpa_protected_areas');
        createdDataset.should.have.property('userId').and.be.exactly(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.be.exactly('pending');
        createdDataset.should.have.property('overwrite').and.be.exactly(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Create a FeatureServer dataset */
    it('Create a FeatureServer dataset', async() => {
        let response = null;
        const timestamp = new Date().getTime();
        const dataset = {
            name: `FeatureServer Dataset - ${timestamp}`,
            application: ['gfw', 'rw'],
            connectorType: 'rest',
            provider: 'featureservice',
            env: 'production',
            connectorUrl: 'http://services6.arcgis.com/bIipaUHHcz1GaAsv/arcgis/rest/services/Mineral_Development_Agreements/FeatureServer/0?f=pjson',
            overwrite: true
        };
        let createdDataset = null;
        try {
            response = await request.post(`${BASE_URL}/dataset`).send({
                dataset,
                loggedUser: ROLES.ADMIN
            });
            createdDataset = deserializeDataset(response);
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Object();
        createdDataset.should.have.property('name').and.be.exactly(`FeatureServer Dataset - ${timestamp}`);
        createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(2);
        createdDataset.should.have.property('connectorType').and.be.exactly('rest');
        createdDataset.should.have.property('provider').and.be.exactly('featureservice');
        createdDataset.should.have.property('connectorUrl').and.be.exactly('http://services6.arcgis.com/bIipaUHHcz1GaAsv/arcgis/rest/services/Mineral_Development_Agreements/FeatureServer/0?f=pjson');
        createdDataset.should.have.property('tableName').and.be.exactly('Mineral_Development_Agreements');
        createdDataset.should.have.property('userId').and.be.exactly(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.be.exactly('pending');
        createdDataset.should.have.property('overwrite').and.be.exactly(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Create a JSON */
    it('Create a JSON dataset', async() => {
        let response = null;
        const timestamp = new Date().getTime();
        const dataset = {
            name: `JSON Dataset - ${timestamp}`,
            application: ['forest-atlas', 'rw'],
            connectorType: 'document',
            env: 'production',
            provider: 'json',
            dataPath: 'data',
            data: {
                data: [
                    {
                        a: 1,
                        b: 2
                    },
                    {
                        a: 2,
                        b: 1
                    },
                ]
            }
        };
        let createdDataset = null;
        try {
            response = await request.post(`${BASE_URL}/dataset`).send({
                dataset,
                loggedUser: ROLES.ADMIN
            });
            createdDataset = deserializeDataset(response);
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Object();
        createdDataset.should.have.property('name').and.be.exactly(`JSON Dataset - ${timestamp}`);
        createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(2);
        createdDataset.should.have.property('connectorType').and.be.exactly('document');
        createdDataset.should.have.property('provider').and.be.exactly('json');
        createdDataset.should.have.property('connectorUrl');
        createdDataset.should.have.property('tableName');
        createdDataset.should.have.property('userId').and.be.exactly(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.be.exactly('pending');
        createdDataset.should.have.property('overwrite').and.be.exactly(false);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Get All Datasets */
    it('Get datasets', async() => {
        let response = null;
        try {
            response = await request.get(`${BASE_URL}/dataset`).send();
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Array();
        response.body.should.have.property('links').and.be.a.Object();
    });

    /* Get a specific dataset */
    it('Get one dataset', async() => {
        let response = null;
        let dataset = null;
        try {
            response = await request.get(`${BASE_URL}/dataset/${referencedDataset.id}`).send();
            dataset = deserializeDataset(response);
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Object();
        dataset.should.have.property('name').and.be.exactly(referencedDataset.attributes.name);
    });

    /* Pagination */
    it('Get 3 datasets', async() => {
        let response = null;
        try {
            response = await request.get(`${BASE_URL}/dataset?page[number]=1&page[size]=3`).send();
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(3);
        response.body.should.have.property('links').and.be.a.Object();
    });

    /* Update */
    it('Update a dataset', async() => {
        let response = null;
        let dataset = null;
        try {
            response = await request.patch(`${BASE_URL}/dataset/${referencedDataset.id}`).send({
                name: 'other name',
                application: ['gfw', 'rw'],
                loggedUser: ROLES.ADMIN
            });
            dataset = deserializeDataset(response);
        } catch (e) {
            logger.error(e);
        }
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a.Object();
        dataset.should.have.property('name').and.be.exactly('other name');
        dataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(2);
        dataset.should.have.property('connectorType').and.be.exactly('rest');
        dataset.should.have.property('provider').and.be.exactly('cartodb');
        dataset.should.have.property('connectorUrl').and.be.exactly('https://wri-01.carto.com/tables/wdpa_protected_areas/table');
        dataset.should.have.property('tableName').and.be.exactly('wdpa_protected_areas');
        dataset.should.have.property('userId').and.be.exactly(ROLES.ADMIN.id);
        dataset.should.have.property('status').and.be.exactly('pending');
        dataset.should.have.property('overwrite').and.be.exactly(true);
        dataset.legend.should.be.an.instanceOf(Object);
        dataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Delete */
    it('Not authorized dataset deletion', async() => {
        try {
            await request.delete(`${BASE_URL}/dataset/${referencedDataset.id}?loggedUser=null`).send();
        } catch (e) {
            logger.error(e);
            e.response.status.should.equal(401);
        }
    });

    after(() => {
    });
});
