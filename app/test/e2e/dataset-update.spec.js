/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { ROLES } = require('./test.constants');
const { createDataset, deserializeDataset } = require('./utils');

const should = chai.should();

const { getTestServer } = require('./test-server');

const requester = getTestServer();

let cartoFakeDataset = null;

describe('Dataset update tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();
    });

    /* Update */
    it('Update a dataset', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                name: 'other name',
                application: ['gfw', 'rw'],
                loggedUser: ROLES.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('name').and.equal('other name');
        dataset.should.have.property('connectorType').and.equal('rest');
        dataset.should.have.property('provider').and.equal('cartodb');
        dataset.should.have.property('connectorUrl').and.equal(cartoFakeDataset.connectorUrl);
        dataset.should.have.property('tableName').and.equal(cartoFakeDataset.tableName);
        dataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        dataset.should.have.property('status').and.equal('saved');
        dataset.should.have.property('overwrite').and.equal(true);
        dataset.legend.should.be.an.instanceOf(Object);
        dataset.clonedHost.should.be.an.instanceOf(Object);
    });


    it('Update a dataset with a valid dataLastUpdated value should work correctly', async () => {
        const timestamp = new Date().toISOString();

        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                dataLastUpdated: timestamp,
                loggedUser: ROLES.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('dataLastUpdated').and.equal(timestamp);
    });


    it('Update a dataset with an invalid dataLastUpdated should fail', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                dataLastUpdated: 'potato',
                loggedUser: ROLES.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`- dataLastUpdated: must be an date - `);
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
