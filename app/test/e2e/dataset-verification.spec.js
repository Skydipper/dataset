const nock = require('nock');

const Dataset = require('models/dataset.model');

const { createDataset, ensureCorrectError } = require('./utils');
const { BLOCKCHAIN_FAKE_INFO, STAMPERY_RESPONSE_OBJECT } = require('./test.constants');
const { getTestServer } = require('./test-server');
const { ROLES } = require('./test.constants');

const requester = getTestServer();

let jsonFakeDataset; let
    blockchainFakeDataset;

const BASE_URL = '/api/v1/dataset';

describe('Upload raw data', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Dataset.remove({}).exec();

        jsonFakeDataset = await new Dataset(createDataset('json')).save();
        blockchainFakeDataset = await new Dataset({
            ...createDataset('json'),
            ...BLOCKCHAIN_FAKE_INFO
        }).save();
    });

    it('Return `Not verification data` if there\'s no blockchain info', async () => {
        const response = await requester.get(`${BASE_URL}/${jsonFakeDataset.id}/verification`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('message').and.equal('Not verification data');
    });

    it('Return blockchain info', async () => {
        nock(`https://api-prod.stampery.com:443`)
            .get(`/stamps/${BLOCKCHAIN_FAKE_INFO.blockchain.id}`)
            .once()
            .reply(200, STAMPERY_RESPONSE_OBJECT, {
                Server: 'Stampery/6.0.0',
                Via: '1.1 vegur'
            });

        const response = await requester.get(`${BASE_URL}/${blockchainFakeDataset.id}/verification`)
            .send();

        response.status.should.equal(200);
        response.body[0].should.have.property('id').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.id);
        response.body[0].should.have.property('hash').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.hash);

    });

    it('Return blockchain info in a private dataset as owner of dataset', async () => {
        const privateDlockchainFakeDataset = await new Dataset({
            ...createDataset('json', { isPrivate: true }),
            ...BLOCKCHAIN_FAKE_INFO
        }).save();

        nock(`https://api-prod.stampery.com:443`)
            .get(`/stamps/${BLOCKCHAIN_FAKE_INFO.blockchain.id}`)
            .once()
            .reply(200, STAMPERY_RESPONSE_OBJECT, {
                Server: 'Stampery/6.0.0',
                Via: '1.1 vegur'
            });

        const response = await requester
            .get(`${BASE_URL}/${privateDlockchainFakeDataset.id}/verification`)
            .query({ loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        response.status.should.equal(200);
        response.body[0].should.have.property('id').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.id);
        response.body[0].should.have.property('hash').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.hash);
    });

    it('Return not found error when trying to get the blockchain info in the private dataset as not owner', async () => {
        const privateDlockchainFakeDataset = await new Dataset({
            ...createDataset('json', { isPrivate: true }),
            ...BLOCKCHAIN_FAKE_INFO
        }).save();

        const response = await requester
            .get(`${BASE_URL}/${privateDlockchainFakeDataset.id}/verification`)
            .query({ loggedUser: JSON.stringify(ROLES.ADMIN2) })
            .send();

        response.status.should.equal(404);
        ensureCorrectError(response.body, `Dataset with id '${privateDlockchainFakeDataset._id}' doesn't exist`);
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
