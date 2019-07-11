const fs = require('fs');
const nock = require('nock');
const chai = require('chai');

const Dataset = require('models/dataset.model');

const { ROLES } = require('./test.constants');
const { getTestServer } = require('./test-server');

const should = chai.should();

const requester = getTestServer();

const BASE_URL = '/api/v1/dataset';

describe('Upload raw data', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Dataset.remove({}).exec();
    });

    it('Return error if no user provided', async () => {
        const filename = 'dataset_1.csv';

        const fileData = fs.readFileSync(`${__dirname}/upload-data/${filename}`);

        const response = await requester.post(`${BASE_URL}/upload`)
            .field('provider', 'csv')
            .attach('dataset', fileData, filename);

        response.status.should.equal(404);
    });

    it('Return 400 when uploading a large file', async function () {
        const filename = 'large_dataset.csv';
    
        const fileData = fs.readFileSync(`${__dirname}/upload-data/${filename}`);
    
        const response = await requester.post(`${BASE_URL}/upload`)
            .field('loggedUser', JSON.stringify(ROLES.USER))
            .field('provider', 'csv')
            .attach('dataset', fileData, filename)
            .send();
    
        response.status.should.equal(400);
        response.body.errors[0].detail.should.equal('- dataset: file too large - ');
    });

    it('Return error if no data provided at all', async () => {
        const response = await requester.post(`${BASE_URL}/upload`);

        response.status.should.equal(404);
    });

    it('Return error if provider and file are different', async () => {
        const filename = 'dataset_1.json';
    
        const fileData = fs.readFileSync(`${__dirname}/upload-data/${filename}`);

        const response = await requester.post(`${BASE_URL}/upload`)
            .field('loggedUser', JSON.stringify(ROLES.USER))
            .field('provider', 'csv')
            .attach('dataset', fileData, filename)
            .send();

        response.status.should.equal(400);
    });

    it('Return 200 when uploading a file', async () => {
        const filename = 'dataset_1.csv';

        const fileData = fs.readFileSync(`${__dirname}/upload-data/${filename}`);

        nock('https://wri-api-backups.s3.amazonaws.com:443')
            .put(url => true)
            .once()
            .reply(200, '', {
                'ETag': '"7e3a0db8fad94dd0f51bd9c1b1b239d2"',
                'Content-Length': '0',
                'Server': 'AmazonS3'
            });

        const response = await requester.post(`${BASE_URL}/upload`)
            .field('loggedUser', JSON.stringify(ROLES.USER))
            .field('provider', 'csv')
            .attach('dataset', fileData, filename);

        const regex = /rw.dataset.raw\/.+_dataset_1.csv/g;
        
        response.status.should.equal(200);
        response.body.connectorUrl.should.match(regex);
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
