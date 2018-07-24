/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { createDataset, deserializeDataset, mapDatasetToMetadataSearchResult } = require('./utils');

const { getTestServer } = require('./test-server');

const should = chai.should();

const requester = getTestServer();

let cartoFakeDataset;
let jsonFakeDataset;


describe('Search datasets tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Dataset.remove({}).exec();

        cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();
        jsonFakeDataset = await new Dataset(createDataset('json')).save();
    });

    it('Search for common elements in name adn description should return 2 results (no synonyms)', async () => {
        nock(`${process.env.CT_URL}`)
            .get(`/v1/metadata?search=fake%20dataset`)
            .reply(200, {
                data: [
                    mapDatasetToMetadataSearchResult(cartoFakeDataset),
                    mapDatasetToMetadataSearchResult(jsonFakeDataset)
                ]
            });

        nock(`${process.env.CT_URL}`)
            .get(`/v1/graph/query/search-by-label-synonyms?search=fake%20dataset`)
            .reply(200, {
                data: []
            });

        const response = await requester.get(`/api/v1/dataset?search=fake%20dataset`).send();
        const datasets = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
        response.body.should.have.property('links').and.be.an('object');

        const datasetIds = datasets.map(dataset => dataset.id);

        datasetIds.includes(jsonFakeDataset._id);
        datasetIds.includes(cartoFakeDataset._id);
    });

    it('Search for name of one dataset should return a single result (no synonyms)', async () => {
        nock(`${process.env.CT_URL}`)
            .get(`/v1/metadata?search=${encodeURIComponent(cartoFakeDataset.name)}`)
            .reply(200, {
                data: [
                    mapDatasetToMetadataSearchResult(cartoFakeDataset),
                ]
            });

        nock(`${process.env.CT_URL}`)
            .get(`/v1/graph/query/search-by-label-synonyms?search=${encodeURIComponent(cartoFakeDataset.name)}`)
            .reply(200, {
                data: []
            });

        const response = await requester.get(`/api/v1/dataset?search=${encodeURIComponent(cartoFakeDataset.name)}`).send();
        const datasets = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(1);
        response.body.should.have.property('links').and.be.an('object');

        const datasetIds = datasets.map(dataset => dataset.id);

        datasetIds.includes(jsonFakeDataset._id);
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
