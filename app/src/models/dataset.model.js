const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uuidV4 = require('uuid/v4');
const Schema = mongoose.Schema;
const STATUS = require('app.constants').STATUS;

const Dataset = new Schema({
    _id: { type: String, default: uuidV4 },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: false, trim: true, default: null },
    subtitle: { type: String, required: false, trim: true, default: null },
    application: [
        { type: String, required: true, trim: true }
    ],
    dataPath: { type: String, required: false, trim: true, default: null },
    attributesPath: { type: String, required: false, trim: true, default: null },
    connectorType: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    userId: { type: String, required: true, trim: true },
    connectorUrl: { type: String, required: false, trim: true, default: null },
    tableName: { type: String, required: false, trim: true, default: null },
    status: { type: String, enum: STATUS, default: 'pending' },
    overwrite: { type: Boolean, required: false, default: false },
    verified: { type: Boolean, required: false, default: false },
    errorMessage: { type: String, required: false, trim: true, default: null },
    published: { type: Boolean, required: true, default: true },
    env: { type: String, required: true, default: 'production', trim: true },
    geoInfo: { type: Boolean, required: true, default: false },
    protected: { type: Boolean, required: true, default: false },
    subscribable: { type: Schema.Types.Mixed },
    blockchain: {
        _id: false,
        id: { type: String, required: false, trim: true },
        hash: { type: String, required: false, trim: true },
        time: { type: String, required: false, trim: true },
        backupUrl: { type: String, required: false, trim: true },
    },
    legend: {
        _id: false,
        lat: { type: String, required: false, trim: true },
        long: { type: String, required: false, trim: true },
        date: [{ type: String, required: false, trim: true }],
        region: [{ type: String, required: false, trim: true }],
        country: [{ type: String, required: false, trim: true }],
        nested: [{ type: String, required: false, trim: true }]
    },
    clonedHost: {
        _id: false,
        hostProvider: { type: String, required: false, trim: true },
        hostUrl: { type: String, required: false, trim: true },
        hostId: { type: String, required: false, trim: true },
        hostType: { type: String, required: false, trim: true },
        hostPath: { type: String, required: false, trim: true }
    },
    widgetRelevantProps: [{ type: String, required: false, trim: true }],
    layerRelevantProps: [{ type: String, required: false, trim: true }],
    updatedAt: { type: Date, default: Date.now }
});

Dataset.plugin(mongoosePaginate);

module.exports = mongoose.model('Dataset', Dataset);
