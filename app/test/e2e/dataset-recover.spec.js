const fs = require('fs');
const nock = require('nock');
const chai = require('chai');

const Dataset = require('models/dataset.model');

const { ROLES } = require('./test.constants');
const { createDataset } = require('./utils');
const { getTestServer } = require('./test-server');

const should = chai.should();

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
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/recover`)
            .send();

        response.status.should.equal(401);
    });

    it('Return 401 error if role is either USER or MANAGER', async () => {
        const responseUser = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/recover`)
            .field('loggedUser', JSON.stringify(ROLES.USER))
            .send();
        const responseManager = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/recover`)
            .field('loggedUser', JSON.stringify(ROLES.MANAGER))
            .send();

        responseUser.status.should.equal(401);
        responseManager.status.should.equal(401);
    });

    it('Return 404 error if the dataset doesn\'t exist', async () => {
        const response = await requester.post(`${BASE_URL}/fake-id/recover`)
            .field('loggedUser', JSON.stringify(ROLES.ADMIN))
            .send();

        response.status.should.equal(404);
    });

    it('Successfully recover a dataset', async () => {
        const response = await requester.post(`${BASE_URL}/${jsonFakeDataset.id}/recover`)
            .field('loggedUser', JSON.stringify(ROLES.ADMIN))
            .send();

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
