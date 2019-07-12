const nock = require('nock');
const chai = require('chai');

const Dataset = require('models/dataset.model');

const { createDataset } = require('./utils');
const { getTestServer } = require('./test-server');

const should = chai.should();

const requester = getTestServer();

let jsonFakeDataset, blockchainFakeDataset;

const BLOCKCHAIN_FAKE_INFO = {
    verified: true,
    blockchain: {
    	id: "5857d1629e7cba66c3ea20a8",
    	hash: "000dc75a315c77a1f9c98fb6247d03dd18ac52632d7dc6a9920261d8109b37cf"
    }
};

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
            })
            .save();
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
            .reply(200, stamperyResponseObject, {
                  "Server": "Stampery/6.0.0",
                  "Via": "1.1 vegur"
              })

        const response = await requester.get(`${BASE_URL}/${blockchainFakeDataset.id}/verification`)
            .send();

        response.status.should.equal(200);
        response.body[0].should.have.property('id').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.id);
        response.body[0].should.have.property('hash').and.equal(BLOCKCHAIN_FAKE_INFO.blockchain.hash);

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

const stamperyResponseObject = {
    "error": null,
    "result": [
        {
        "token": "64a52c59f71717e",
        "id": BLOCKCHAIN_FAKE_INFO.blockchain.id,
        "time": "2016-12-24 00:49:38.759000",
        "hash": BLOCKCHAIN_FAKE_INFO.blockchain.hash,
        "receipts": {
            "btc": {
            "@context": "https://w3id.org/chainpoint/v2",
            "type": "BTA-SHA256",
            "merkleRoot":
    "8F1B7E8B6FBE3C49423E783B7B95DB3B2598643811A9C127D77AABE8BCF5C274",
            "proof": [
                {
                "left":
    "6AB48D00708B22D3833EA32C7C0D556989B9A4509F31779BC8BDC0DD094FB219"
                },
                {
                "right":
    "BF5D1937D05F4CBB32E4287BF6C560BB176C44D2F59FB140AECD09B573E5119D"
                }
            ],
            "targetHash":
    "A98E5C8103D2383A439CEFCAA493AD5A577708D66F6C0B594FACA2C7BC83975D",
            "anchors": [
                {
                "prefix": "5336F7C1",
                "type": "BTCTestnetOpReturn",
                "sourceId":
    "1c9b593c5a8a0bf4dea2be23330fc4ba192e153aa9c3465cddb2a898ea932c44"
                }
            ]
            },
            "eth": {
            "@context": "https://w3id.org/chainpoint/v2",
            "type": "BTA-SHA256",
            "merkleRoot":
    "27F6A3F86E32357DEAA9499520C01A230DBF6AA731A2958E8C0EBD4414CEF4ED",
            "proof": [
                {
                "left":
    "6AB48D00708B22D3833EA32C7C0D556989B9A4509F31779BC8BDC0DD094FB219"
                }
            ],
            "targetHash":
    "A98E5C8103D2383A439CEFCAA493AD5A577708D66F6C0B594FACA2C7BC83975D",
            "anchors": [
                {
                "prefix": "5336940F",
                "type": "ETHTestnetData",
                "sourceId":
    "0x6f2eb4a94920df4c0131b67483ba6282d9c6668069ea03afb073e8c68b609510"
                }
            ]
            }
        }
        }
    ]
}