const nock = require('nock');

const Dataset = require('models/dataset.model');

const { USERS } = require('./test.constants');
const { createDataset, ensureCorrectError } = require('./utils');
const { getTestServer } = require('./test-server');

const requester = getTestServer();

let jsonFakeDataset;

const BASE_URL = '/api/v1/dataset';

describe('Upload raw data', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Dataset.remove({}).exec();

        jsonFakeDataset = await new Dataset(createDataset('json')).save();
    });

    it('Return 401 error if no user provided', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/flush`);

        response.status.should.equal(401);
        ensureCorrectError(response.body, 'Unauthorized');
    });

    it('Return 403 error if role USER tries to flush a dataset', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/flush`)
            .field('loggedUser', JSON.stringify(USERS.USER));


        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Forbidden');
    });

    it('Return 403 error if the dataset doesn\'t exit', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/flush`)
            .field('loggedUser', JSON.stringify(USERS.USER));


        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Forbidden');
    });

    it('Successfully flush a dataset as a MANAGER', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/flush`)
            .field('loggedUser', JSON.stringify(USERS.MANAGER));


        response.status.should.equal(200);
    });

    it('Successfully flush a dataset as an ADMIN', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/flush`)
            .field('loggedUser', JSON.stringify(USERS.ADMIN));


        response.status.should.equal(200);
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
