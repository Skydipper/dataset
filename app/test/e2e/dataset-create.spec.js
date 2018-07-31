/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { ROLES } = require('./test.constants');
const { deserializeDataset } = require('./utils');
const { getTestServer } = require('./test-server');

const should = chai.should();

const requester = getTestServer();


describe('Dataset create tests', () => {

    before(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        Dataset.remove({}).exec();

        nock.cleanAll();
    });

    /* Create a Carto Dataset */
    it('Create a CARTO DB dataset should be successful', async () => {
        nock(`${process.env.CT_URL}`)
            .post(/v1\/graph\/dataset\/(\w|-)*$/)
            .once()
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        nock(`${process.env.CT_URL}/v1`)
            .post('/rest-datasets/cartodb', () => true)
            .once()
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

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
        const response = await requester
            .post(`/api/v1/dataset`)
            .send({
                dataset,
                loggedUser: ROLES.ADMIN
            });
        const createdDataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        createdDataset.should.have.property('name').and.equal(`Carto DB Dataset - ${timestamp}`);
        // createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(1);
        createdDataset.should.have.property('connectorType').and.equal('rest');
        createdDataset.should.have.property('provider').and.equal('cartodb');
        createdDataset.should.have.property('connectorUrl').and.equal('https://wri-01.carto.com/tables/wdpa_protected_areas/table');
        createdDataset.should.have.property('tableName').and.equal('wdpa_protected_areas');
        createdDataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.equal('pending');
        createdDataset.should.have.property('overwrite').and.equal(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Create a FeatureServer dataset */
    it('Create a FeatureServer dataset should be successful', async () => {
        nock(`${process.env.CT_URL}/v1`)
            .post('/rest-datasets/featureservice', () => true)
            .once()
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

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

        const response = await requester.post(`/api/v1/dataset`).send({
            dataset,
            loggedUser: ROLES.ADMIN
        });
        const createdDataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        createdDataset.should.have.property('name').and.equal(`FeatureServer Dataset - ${timestamp}`);
        // createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(2);
        createdDataset.should.have.property('connectorType').and.equal('rest');
        createdDataset.should.have.property('provider').and.equal('featureservice');
        createdDataset.should.have.property('connectorUrl').and.equal('http://services6.arcgis.com/bIipaUHHcz1GaAsv/arcgis/rest/services/Mineral_Development_Agreements/FeatureServer/0?f=pjson');
        createdDataset.should.have.property('tableName').and.equal('Mineral_Development_Agreements');
        createdDataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.equal('pending');
        createdDataset.should.have.property('overwrite').and.equal(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    /* Create a JSON */
    it('Create a JSON dataset should be successful', async () => {
        nock(`${process.env.CT_URL}/v1`)
            .post('/doc-datasets/json', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

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

        const response = await requester.post(`/api/v1/dataset`).send({
            dataset,
            loggedUser: ROLES.ADMIN
        });
        const createdDataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        createdDataset.should.have.property('name').and.equal(`JSON Dataset - ${timestamp}`);
        // createdDataset.application.should.be.an.instanceOf(Array).and.have.lengthOf(2);
        createdDataset.should.have.property('connectorType').and.equal('document');
        createdDataset.should.have.property('provider').and.equal('json');
        createdDataset.should.have.property('connectorUrl');
        createdDataset.should.have.property('tableName');
        createdDataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.equal('pending');
        createdDataset.should.have.property('overwrite').and.equal(false);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(() => {
        Dataset.remove({}).exec();
    });
});
