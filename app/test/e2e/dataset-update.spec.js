/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { USERS } = require('./test.constants');
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
    it('Update a dataset (happy case)', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                name: 'other name',
                application: ['gfw', 'rw'],
                loggedUser: USERS.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('name').and.equal('other name');
        dataset.should.have.property('connectorType').and.equal('rest');
        dataset.should.have.property('provider').and.equal('cartodb');
        dataset.should.have.property('connectorUrl').and.equal(cartoFakeDataset.connectorUrl);
        dataset.should.have.property('tableName').and.equal(cartoFakeDataset.tableName);
        dataset.should.have.property('userId').and.equal(USERS.ADMIN.id);
        dataset.should.have.property('applicationConfig').and.deep.equal(cartoFakeDataset.applicationConfig);
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
                loggedUser: USERS.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('dataLastUpdated').and.equal(timestamp);
        dataset.should.have.property('createdAt').and.equal(cartoFakeDataset.createdAt.toISOString());
    });


    it('Update a dataset with an invalid dataLastUpdated should fail', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                dataLastUpdated: 'potato',
                loggedUser: USERS.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`- dataLastUpdated: must be an date - `);
    });

    it('Update status for a dataset as non-admin should fail', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                status: 'pending',
                application: ['gfw', 'rw'],
                loggedUser: USERS.MANAGER
            });

        response.status.should.equal(403);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`User does not have permission to update status on dataset with id ${cartoFakeDataset._id}`);
    });

    it('Update status for a dataset as non-admin with invalid status (string) should fail', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                status: 'fail',
                application: ['gfw', 'rw'],
                loggedUser: USERS.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Invalid status 'fail' for update to dataset with id ${cartoFakeDataset._id}`);
    });

    it('Update status for a dataset as non-admin with invalid status (int) should fail', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                status: 78,
                application: ['gfw', 'rw'],
                loggedUser: USERS.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Invalid status '78' for update to dataset with id ${cartoFakeDataset._id}`);
    });

    it('Update status for a dataset as admin with valid status (string) should succeed', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                status: 'pending',
                application: ['gfw', 'rw'],
                loggedUser: USERS.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('status').and.equal('pending');
        dataset.legend.should.be.an.instanceOf(Object);
        dataset.clonedHost.should.be.an.instanceOf(Object);
    });

    it('Update status for a dataset as admin with valid status (int) should succeed', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send({
                status: 2,
                application: ['gfw', 'rw'],
                loggedUser: USERS.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('status').and.equal('failed');
        dataset.legend.should.be.an.instanceOf(Object);
        dataset.clonedHost.should.be.an.instanceOf(Object);
        dataset.should.have.property('createdAt').and.equal(cartoFakeDataset.createdAt.toISOString());
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
