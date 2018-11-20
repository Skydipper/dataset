/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Dataset = require('models/dataset.model');
const { ROLES } = require('./test.constants');
const { createDataset, deserializeDataset } = require('./utils');
const { getTestServer } = require('./test-server');

const should = chai.should();

const requester = getTestServer();
nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let cartoFakeDataset = null;

describe('Dataset clone tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        Dataset.remove({}).exec();

        cartoFakeDataset = await new Dataset(createDataset('cartodb')).save();

        nock.cleanAll();
    });

    it('Clone a dataset as an ADMIN should be successful', async () => {
        nock(process.env.CT_URL)
            .post(/v1\/graph\/dataset\/(\w|-)*$/)
            .once()
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });

        const response = await requester
            .post(`/api/v1/dataset/${cartoFakeDataset._id}/clone`)
            .send({
                datasetUrl: 'other dataset url',
                application: ['gfw', 'rw'],
                loggedUser: ROLES.ADMIN
            });
        const dataset = deserializeDataset(response);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');

        dataset.should.have.property('name').and.not.equal(cartoFakeDataset.name);
        response.body.data.should.have.property('id').and.not.equal(cartoFakeDataset._id);

        dataset.should.have.property('application').and.deep.equal(['gfw', 'rw']);
        dataset.should.have.property('connectorType').and.equal('document');
        dataset.should.have.property('provider').and.equal('json');
        dataset.should.have.property('connectorUrl').and.equal('other dataset url');
        dataset.should.have.property('tableName').and.equal(cartoFakeDataset.tableName);
        dataset.should.have.property('userId').and.equal(ROLES.ADMIN.id);
        dataset.should.have.property('status').and.equal('pending');
        dataset.should.have.property('overwrite').and.equal(true);
        dataset.legend.should.be.an.instanceOf(Object);
        dataset.clonedHost.should.be.an.instanceOf(Object);
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
