/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { createDataset, deserializeDataset } = require('./utils');

const { getTestServer } = require('./test-server');
const { getUUID, expectedDataset } = require('./utils');

const should = chai.should();

const requester = getTestServer();

let cartoFakeDataset;
let jsonFakeDataset;
let jsonFakeDatasetWithSources;


describe('Get datasets tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Dataset.remove({}).exec();

        cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();
        jsonFakeDataset = await new Dataset(createDataset('json')).save();

        const datasetWithSources = createDataset('json');
        datasetWithSources.sources = [datasetWithSources.connectorUrl];
        delete datasetWithSources.connectorUrl;

        jsonFakeDatasetWithSources = await new Dataset(datasetWithSources).save();
    });

    /* Get All Datasets */
    it('Get all datasets with no arguments should be successful', async () => {
        const response = await requester.get(`/api/v1/dataset`).send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array');
        response.body.should.have.property('links').and.be.an('object');

        const datasetOne = deserializeDataset(response)[0];

        datasetOne.attributes.should.have.property('dataLastUpdated').and.equal(cartoFakeDataset.dataLastUpdated.toISOString());
        datasetOne.should.deep.equal(expectedDataset(cartoFakeDataset));
    });

    it('Get an existing dataset by ID should be successful', async () => {
        const response = await requester.get(`/api/v1/dataset/${cartoFakeDataset._id}`).send();
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('name').and.equal(cartoFakeDataset.name);
        response.body.data.should.deep.equal(expectedDataset(cartoFakeDataset));
    });

    it('Get an non-existing dataset by ID should fail', async () => {
        const uuid = getUUID();
        const response = await requester.get(`/api/v1/dataset/${uuid}`).send();

        response.status.should.equal(404);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Dataset with id '${uuid}' doesn't exist`);
    });

    /* Pagination */
    it('Get a page with 3 datasets using pagination', async () => {
        const response = await requester.get(`/api/v1/dataset?page[number]=1&page[size]=3`).send();
        const datasets = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(3);
        response.body.should.have.property('links').and.be.an('object');

        const datasetIds = datasets.map(dataset => dataset.id);

        datasetIds.should.contain(cartoFakeDataset._id);
        datasetIds.should.contain(jsonFakeDataset._id);
        datasetIds.should.contain(jsonFakeDatasetWithSources._id);

        const datasetThree = deserializeDataset(response)[2];

        datasetThree.attributes.should.have.property('sources').and.eql(jsonFakeDatasetWithSources.sources);
        response.body.data[0].should.deep.equal(expectedDataset(cartoFakeDataset));
    });

    it('Get the first page with one dataset using pagination', async () => {
        const response = await requester.get(`/api/v1/dataset?page[number]=1&page[size]=1`).send();
        const datasets = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(1);
        response.body.should.have.property('links').and.be.an('object');

        const datasetIds = datasets.map(dataset => dataset.id);

        datasetIds.should.contain(cartoFakeDataset._id);
    });

    it('Get the second page with one dataset using pagination', async () => {
        const response = await requester.get(`/api/v1/dataset?page[number]=2&page[size]=1`).send();
        const datasets = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(1);
        response.body.should.have.property('links').and.be.an('object');

        const datasetIds = datasets.map(dataset => dataset.id);

        datasetIds.should.contain(jsonFakeDataset._id);
    });

    it('Get an existing dataset by ID should be successful - With `sources` field', async () => {
        const response = await requester.get(`/api/v1/dataset/${jsonFakeDatasetWithSources._id}`).send();
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        dataset.should.have.property('name').and.equal(jsonFakeDatasetWithSources.name);
        dataset.should.have.property('sources').and.eql(jsonFakeDatasetWithSources.sources);
        dataset.should.have.property('connectorUrl').and.equal(null);
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
