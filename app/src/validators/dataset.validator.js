const logger = require('logger');
const DatasetNotValid = require('errors/datasetNotValid.error');

class DatasetValidator {

    static getUser(ctx) {
        return Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
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

    static async validateCreation(koaObj) {
        logger.info('Validating Dataset Creation');
        koaObj.checkBody('name').notEmpty().isAscii();
        koaObj.checkBody('type').optional().isAscii()
        .toLow();
        koaObj.checkBody('subtitle').optional().isAscii();
        koaObj.checkBody('application').check(application => DatasetValidator.notEmptyArray(application));
        koaObj.checkBody('dataPath').optional().isAscii();
        koaObj.checkBody('attributesPath').optional().isAscii();
        koaObj.checkBody('connectorType').notEmpty().isAscii()
        .toLow();
        koaObj.checkBody('provider').notEmpty().isAscii()
        .toLow();
        koaObj.checkBody('connectorUrl').optional().notEmpty();
        koaObj.checkBody('tableName').optional().isAscii();
        koaObj.checkBody('overwrite').optional().toBoolean();
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

    static async validateUpdate(koaObj) {
        logger.info('Validating Dataset Update');
        koaObj.checkBody('name').optional().notEmpty()
        .isAscii();
        koaObj.checkBody('type').optional().isAscii()
        .toLow();
        koaObj.checkBody('subtitle').optional().isAscii();
        koaObj.checkBody('application').optional().check(application => DatasetValidator.notEmptyArray(application));
        koaObj.checkBody('dataPath').optional().isAscii();
        koaObj.checkBody('attributesPath').optional().isAscii();
        koaObj.checkBody('connectorType').optional().isAscii()
        .toLow();
        koaObj.checkBody('provider').optional().isAscii()
        .toLow();
        koaObj.checkBody('connectorUrl').optional().notEmpty();
        koaObj.checkBody('tableName').optional().isAscii();
        koaObj.checkBody('overwrite').optional().toBoolean();
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
        koaObj.checkBody('application').notEmpty().check(application => DatasetValidator.notEmptyArray(application));
        koaObj.checkBody('datasetUrl').notEmpty().isAscii();
        if (koaObj.errors) {
            logger.error('Error validating dataset creation');
            throw new DatasetNotValid(koaObj.errors);
        }
        return true;
    }

}

module.exports = DatasetValidator;
