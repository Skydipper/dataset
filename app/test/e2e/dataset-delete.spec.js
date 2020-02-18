/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { ROLES } = require('./test.constants');
const { createDataset, getUUID, deserializeDataset } = require('./utils');

const should = chai.should();

const { getTestServer } = require('./test-server');

const requester = getTestServer();

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('Dataset delete tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Not authorized dataset deletion should fail', async () => {
        const cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();

        const response = await requester
            .delete(`/api/v1/dataset/${cartoFakeDataset._id}`)
            .send();

        response.status.should.equal(401);
    });

    it('Deleting a non-existing dataset should fail', async () => {
        const uuid = getUUID();
        const response = await requester.delete(`/api/v1/dataset/${uuid}?loggedUser=${JSON.stringify(ROLES.ADMIN)}`).send();

        response.status.should.equal(404);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Dataset with id '${uuid}' doesn't exist`);
    });

    it('Deleting an existing carto dataset should be successful and return the dataset', async () => {
        const cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();

        nock(`${process.env.CT_URL}`)
            .get(`/v1/dataset/${cartoFakeDataset._id}/layer?protected=true`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${cartoFakeDataset._id}/vocabulary/knowledge_graph?application=rw`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${cartoFakeDataset._id}/layer`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${cartoFakeDataset._id}/metadata`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${cartoFakeDataset._id}/vocabulary`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        const deleteResponse = await requester.delete(`/api/v1/dataset/${cartoFakeDataset._id}?loggedUser=${JSON.stringify(ROLES.ADMIN)}`).send();

        deleteResponse.status.should.equal(200);
        const createdDataset = deserializeDataset(deleteResponse);

        deleteResponse.status.should.equal(200);
        deleteResponse.body.should.have.property('data').and.be.an('object');
        createdDataset.should.have.property('name').and.equal(cartoFakeDataset.name);
        createdDataset.should.have.property('applicationConfig').and.deep.equal(cartoFakeDataset.applicationConfig);
        createdDataset.should.have.property('connectorType').and.equal('rest');
        createdDataset.should.have.property('provider').and.equal('cartodb');
        createdDataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.equal('saved');
        createdDataset.should.have.property('overwrite').and.equal(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);

        const getResponse = await requester.get(`/api/v1/dataset/${cartoFakeDataset._id}`).send();

        getResponse.status.should.equal(404);
        getResponse.body.should.have.property('errors').and.be.an('array');
        getResponse.body.errors[0].should.have.property('detail').and.equal(`Dataset with id '${cartoFakeDataset._id}' doesn't exist`);
    });

    it('Deleting an existing carto dataset with missing layer MS should fail with a meaningful error', async () => {
        const cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();

        nock(`${process.env.CT_URL}`)
            .get(`/v1/dataset/${cartoFakeDataset._id}/layer?protected=true`)
            .once()
            .reply(404, {
                status: 404,
                detail: 'Endpoint not found'
            });

        const response = await requester.delete(`/api/v1/dataset/${cartoFakeDataset._id}?loggedUser=${JSON.stringify(ROLES.ADMIN)}`).send();

        response.status.should.equal(500);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Error obtaining protected layers of the dataset: 404 - {"status":404,"detail":"Endpoint not found"}`);
    });

    it('Deleting an existing json dataset should be successful and return the dataset (happy case)', async () => {
        const cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();
        const jsonFakeDataset = await new Dataset(createDataset('json')).save();

        nock(`${process.env.CT_URL}`)
            .get(`/v1/dataset/${jsonFakeDataset._id}/layer?protected=true`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${jsonFakeDataset._id}/vocabulary/knowledge_graph?application=rw`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${jsonFakeDataset._id}/layer`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${jsonFakeDataset._id}/metadata`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        nock(`${process.env.CT_URL}`)
            .delete(`/v1/dataset/${jsonFakeDataset._id}/vocabulary`)
            .once()
            .reply(200, {
                status: 200,
                data: []
            });

        const deleteResponse = await requester
            .delete(`/api/v1/dataset/${jsonFakeDataset._id}?loggedUser=${JSON.stringify(ROLES.ADMIN)}`)
            .send();

        deleteResponse.status.should.equal(200);
        const createdDataset = deserializeDataset(deleteResponse);

        deleteResponse.status.should.equal(200);
        deleteResponse.body.should.have.property('data').and.be.an('object');
        createdDataset.should.have.property('name').and.equal(jsonFakeDataset.name);
        createdDataset.should.have.property('connectorType').and.equal('document');
        createdDataset.should.have.property('provider').and.equal('json');
        createdDataset.should.have.property('applicationConfig').and.deep.equal(jsonFakeDataset.applicationConfig);
        createdDataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        createdDataset.should.have.property('status').and.equal('saved');
        createdDataset.should.have.property('overwrite').and.equal(true);
        createdDataset.legend.should.be.an.instanceOf(Object);
        createdDataset.clonedHost.should.be.an.instanceOf(Object);

        const getResponse = await requester
            .get(`/api/v1/dataset/${jsonFakeDataset._id}`)
            .send();

        getResponse.status.should.equal(404);
        getResponse.body.should.have.property('errors').and.be.an('array');
        getResponse.body.errors[0].should.have.property('detail').and.equal(`Dataset with id '${jsonFakeDataset._id}' doesn't exist`);
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
