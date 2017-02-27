const mongoose = require('mongoose');
const uuidV4 = require('uuid/v4');
const Schema = mongoose.Schema;
const STATUS = require('app.constants').STATUS;

const Dataset = new Schema({
    _id: { type: String, default: uuidV4 },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: false, trim: true },
    subtitle: { type: String, required: false, trim: true },
    application: [
        { type: String, required: true, trim: true }
    ],
    dataPath: { type: String, required: false, trim: true },
    attributesPath: { type: String, required: false, trim: true },
    connectorType: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    userId: { type: String, required: true, trim: true },
    connectorUrl: { type: String, required: false, trim: true },
    tableName: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUS, default: 'saved' },
    overwrite: { type: Boolean, required: false, default: false },
    legend: {
        _id: false,
        lat: { type: String, required: false, trim: true },
        long: { type: String, required: false, trim: true },
        date: { type: Date },
        region: { type: String, required: false, trim: true },
        country: { type: String, required: false, trim: true }
    },
    clonedHost: {
        _id: false,
        hostProvider: { type: String, required: false, trim: true },
        hostUrl: { type: String, required: false, trim: true },
        hostId: { type: String, required: false, trim: true },
        hostType: { type: String, required: false, trim: true },
        hostPath: { type: String, required: false, trim: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dataset', Dataset);
