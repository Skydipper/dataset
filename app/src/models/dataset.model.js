const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const STATUS = require('app.constants').STATUS;

const Dataset = new Schema({
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, required: false, trim: true },
    application: { type: Array, required: true, trim: true },
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
        lat: { type: String, required: true, trim: true },
        long: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
        region: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true }
    },
    clonedHost: {
        _id: false,
        hostProvider: { type: String, required: true, trim: true },
        hostUrl: { type: String, required: true, trim: true },
        hostId: { type: String, required: true, trim: true },
        hostType: { type: String, required: true, trim: true },
        hostPath: { type: String, required: true, trim: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dataset', Dataset);
