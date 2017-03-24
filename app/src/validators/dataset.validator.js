const logger = require('logger');
const DatasetNotValid = require('errors/datasetNotValid.error');
const PROVIDERS = require('app.constants').PROVIDERS;


class DatasetValidator {

    static getUser(ctx) {
        return Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
    }

    static notEmptyString(property) {
        if (typeof property === 'string' && property.length > 0) {
            return true;
        }
        return false;
    }

    static isArray(property) {
        if (property instanceof Array) {
            return true;
        }
        return false;
    }

    static notEmptyArray(property) {
        if (property instanceof Array && property.length > 0) {
            return true;
        }
        return false;
    }

    static isObject(property) {
        if (property instanceof Object && property.length === undefined) {
            return true;
        }
        return false;
    }

    static checkProvider(provider) {
        if (Object.keys(PROVIDERS).indexOf(provider) >= 0) {
            return true;
        }
        return false;
    }

    static checkConnectorType(connectorType, koaObj = {}) {
        if (Object.keys(PROVIDERS).indexOf(koaObj.request.body.provider) >= 0 && PROVIDERS[koaObj.request.body.provider].connectorType.indexOf(connectorType) >= 0) {
            return true;
        }
        return false;
    }

    static checkConnectorUrl(connectorUrl, koaObj) {
        let validation = false;
        const provider = koaObj.request.body.provider;
        const connectorType = koaObj.request.body.connectorType;
        const data = koaObj.request.body.data;

        // it is a document - json?
        if (provider === 'document' && connectorType === 'json') {
            // is it data valid?
            if (DatasetValidator.isArray(data) || DatasetValidator.isObject(data)) {
                validation = true;
            // if data is not provided, check if url is valid
            } else {
                if (DatasetValidator.notEmptyString(connectorUrl)) {
                    validation = true;
                } else {
                    validation = false;
                }
            }
        // in other cases just validate url
        } else {
            if (DatasetValidator.notEmptyString(connectorUrl)) {
                validation = true;
            }
        }
        return validation;
    }

    static errorMessage(property, koaObj = {}) {
        let errorMessage = 'validation error';

        switch (property) {

        case 'provider':
            errorMessage = `must be valid [${Object.keys(PROVIDERS).reduce((acc, el) => `${acc}, ${el}`)}]`;
            break;
        case 'connectorType':
            if (PROVIDERS[koaObj.request.body.provider]) {
                errorMessage = `must be valid [${PROVIDERS[koaObj.request.body.provider].connectorType.reduce((acc, el) => `${acc}, ${el}`)}]`;
            } else {
                errorMessage = `there is no connectorType for that provider`;
            }
            break;
        case 'connectorUrl':
            errorMessage = `can not be empty`;
            break;
        default:
            // do nothing

        }
        return errorMessage;
    }

    static async validateCreation(koaObj) {
        logger.info('Validating Dataset Creation');
        koaObj.checkBody('name').notEmpty().isAscii();
        koaObj.checkBody('type').optional().isAscii()
        .toLow();
        koaObj.checkBody('subtitle').optional().isAscii();
        koaObj.checkBody('application').notEmpty().check(application => DatasetValidator.notEmptyArray(application), 'must be a non-empty array');
        koaObj.checkBody('dataPath').optional().isAscii();
        koaObj.checkBody('attributesPath').optional().isAscii();
        // provider
        koaObj.checkBody('provider').notEmpty().isAscii()
        .toLow()
        .check(provider => DatasetValidator.checkProvider(provider), DatasetValidator.errorMessage('provider'));
        // connectorType
        koaObj.checkBody('connectorType').notEmpty().isAscii()
        .toLow()
        .check(connectorType => DatasetValidator.checkConnectorType(connectorType, koaObj), DatasetValidator.errorMessage('connectorType', koaObj));
        // connectorUrl
        koaObj.checkBody('connectorUrl').check(connectorUrl => DatasetValidator.checkConnectorUrl(connectorUrl, koaObj), DatasetValidator.errorMessage('connectorUrl'));
        koaObj.checkBody('tableName').optional().isAscii();
        koaObj.checkBody('overwrite').optional().toBoolean();
        koaObj.checkBody('dataOverwrite').optional().toBoolean();
        koaObj.checkBody('data').optional().check(data => {
            if (DatasetValidator.isArray(data) || DatasetValidator.isObject(data)) {
                return true;
            }
            return false;
        }, 'must be a valid JSON');
        koaObj.checkBody('legend').optional().check(legend => DatasetValidator.isObject(legend), 'must be an object');
        koaObj.checkBody('vocabularies').optional().check(vocabularies => DatasetValidator.isObject(vocabularies), 'must be an object');
        logger.debug(koaObj.errors);
        if (koaObj.errors) {
            logger.error('Error validating dataset creation');
            throw new DatasetNotValid(koaObj.errors);
        }
        return true;
    }

    static async validateUpdate(koaObj) {
        logger.info('Validating Dataset Update');
        koaObj.checkBody('name').optional().notEmpty()
        .isAscii();
        koaObj.checkBody('type').optional().isAscii()
        .toLow();
        koaObj.checkBody('subtitle').optional().isAscii();
        koaObj.checkBody('application').optional().check(application => DatasetValidator.notEmptyArray(application), 'must be a non-empty array');
        koaObj.checkBody('dataPath').optional().isAscii();
        koaObj.checkBody('attributesPath').optional().isAscii();
        koaObj.checkBody('connectorType').optional().isAscii()
        .toLow();
        koaObj.checkBody('provider').optional().isAscii()
        .toLow();
        koaObj.checkBody('connectorUrl').optional().notEmpty();
        koaObj.checkBody('tableName').optional().isAscii();
        koaObj.checkBody('overwrite').optional().toBoolean();
        koaObj.checkBody('dataOverwrite').optional().toBoolean();
        koaObj.checkBody('errorMessage').optional().isAscii();
        koaObj.checkBody('data').optional().check(data => {
            if (DatasetValidator.isArray(data) || DatasetValidator.isObject(data)) {
                return true;
            }
            return false;
        });
        koaObj.checkBody('legend').optional().check(legend => DatasetValidator.isObject(legend));
        koaObj.checkBody('vocabularies').optional().check(vocabularies => DatasetValidator.isObject(vocabularies));
        if (koaObj.errors) {
            logger.error('Error validating dataset creation');
            throw new DatasetNotValid(koaObj.errors);
        }
        return true;
    }

    static async validateCloning(koaObj) {
        logger.info('Validating Dataset Cloning');
        koaObj.checkBody('application').notEmpty().check(application => DatasetValidator.notEmptyArray(application), 'must be a non-empty array');
        koaObj.checkBody('datasetUrl').notEmpty().isAscii();
        if (koaObj.errors) {
            logger.error('Error validating dataset creation');
            throw new DatasetNotValid(koaObj.errors);
        }
        return true;
    }

}

module.exports = DatasetValidator;
