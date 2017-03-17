const URL = require('url').URL;
const logger = require('logger');
const Dataset = require('models/dataset.model');
const RelationshipsService = require('services/relationships.service');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');
const slug = require('slug');

class DatasetService {

    static getSlug(name) {
        return slug(name);
    }

    static getTableName(dataset) {
        if (dataset.provider === 'cartodb' && dataset.connectorUrl) {
            if (dataset.connectorUrl.indexOf('/tables/') >= 0) {
                return new URL(dataset.connectorUrl).pathname.split('/tables/')[1].split('/')[0];
            }
            return decodeURI(new URL(dataset.connectorUrl)).toLowerCase().split('from ')[1].split(' ')[0];
        } else if (dataset.provider === 'featureservice' && dataset.connectorUrl) {
            return new URL(dataset.connectorUrl).pathname.split(/services|FeatureServer/)[1].replace(/\//g, '');
        } else if (dataset.provider === 'rwjson' && dataset.connectorUrl) {
            return 'data';
        }
        return dataset.tableName;
    }

    static getFilteredQuery(query, ids = []) {
        if (!query.application && query.app) {
            query.application = query.app;
        }
        const datasetAttributes = Object.keys(Dataset.schema.obj);
        Object.keys(query).forEach((param) => {
            if (datasetAttributes.indexOf(param) < 0) {
                delete query[param];
            } else {
                switch (Dataset.schema.paths[param].instance) {

                case 'String':
                    query[param] = { $regex: query[param], $options: 'i' };
                    break;
                case 'Array':
                    query[param] = { $in: query[param].split(',').map(elem => elem.trim()) };
                    break;
                case 'Object':
                    query[param] = query[param];
                    break;
                case 'Date':
                    query[param] = query[param];
                    break;
                default:
                    query[param] = query[param];

                }
            }
            if (ids.length > 0) {
                query._id = { $in: ids };
            }
        });
        return query;
    }

    static getFilteredSort(sort) {
        const sortParams = sort.split(',');
        const filteredSort = {};
        const datasetAttributes = Object.keys(Dataset.schema.obj);
        sortParams.forEach((param) => {
            let sign = param.substr(0, 1);
            let realParam = param.substr(1);
            if (sign !== '-') {
                sign = '+';
                realParam = param;
            }
            if (datasetAttributes.indexOf(realParam) >= 0) {
                filteredSort[realParam] = parseInt(sign + 1, 10);
            }
        });
        return filteredSort;
    }

    static async get(id, query = {}) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.info(`[DBACCESS-FIND]: dataset.id: ${id}`);
        let dataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        const includes = query.includes ? query.includes.split(',').map(elem => elem.trim()) : [];
        if (!dataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exist`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exist`);
        }
        if (includes.length > 0) {
            dataset = await RelationshipsService.getRelationships([dataset], includes);
        }
        return dataset;
    }

    static async create(dataset, user) {
        logger.debug(`[DatasetService]: Getting dataset with name:  ${dataset.name}`);
        logger.info(`[DBACCES-FIND]: dataset.name: ${dataset.name}`);
        const tempSlug = DatasetService.getSlug(dataset.name);
        const currentDataset = await Dataset.findOne({
            slug: tempSlug
        });
        if (currentDataset) {
            logger.error(`[DatasetService]: Dataset with name ${dataset.name} generates an existing dataset slug ${tempSlug}`);
            throw new DatasetDuplicated(`Dataset with name '${dataset.name}' generates an existing dataset slug '${tempSlug}'`);
        }
        logger.info(`[DBACCESS-SAVE]: dataset.name: ${dataset.name}`);
        let newDataset = await new Dataset({
            name: dataset.name,
            slug: tempSlug,
            type: dataset.type,
            subtitle: dataset.subtitle,
            application: dataset.application,
            dataPath: dataset.dataPath,
            attributesPath: dataset.attributesPath,
            connectorType: dataset.connectorType,
            provider: dataset.provider,
            userId: user.id,
            connectorUrl: dataset.connectorUrl,
            tableName: DatasetService.getTableName(dataset),
            overwrite: dataset.overwrite || dataset.dataOverwrite,
            legend: dataset.legend,
            clonedHost: dataset.clonedHost
        }).save();
        // if vocabularies
        if (dataset.vocabularies) {
            try {
                await RelationshipsService.createVocabularies(newDataset._id, dataset.vocabularies);
            } catch (err) {
                newDataset.errorMessage = err.message;
                newDataset = await DatasetService.update(newDataset._id, newDataset, { id: 'microservice' });
            }
        }
        return newDataset;
    }

    static async update(id, dataset, user) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.info(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exist`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exist`);
        }
        // let tempSlug;
        // if (dataset.name) {
        //     tempSlug = DatasetService.getSlug(dataset.name);
        //     if (tempSlug !== currentDataset.slug) {
        //         const query = {
        //             slug: tempSlug
        //         };
        //         logger.info(`[DBACCESS-FIND]: dataset.name - ${dataset.name}`);
        //         const otherDataset = await Dataset.findOne(query).exec();
        //         if (otherDataset) {
        //             logger.error(`[DatasetService]: Dataset with name ${dataset.name} generates an existing dataset slug ${tempSlug}`);
        //             throw new DatasetDuplicated(`Dataset with name '${dataset.name}' generates an existing dataset slug '${tempSlug}'`);
        //         }
        //     }
        // }
        const tableName = DatasetService.getTableName(dataset);
        currentDataset.name = dataset.name || currentDataset.name;
        // currentDataset.slug = tempSlug || currentDataset.slug;
        currentDataset.subtitle = dataset.subtitle || currentDataset.subtitle;
        currentDataset.application = dataset.application || currentDataset.application;
        currentDataset.dataPath = dataset.dataPath || currentDataset.dataPath;
        currentDataset.attributesPath = dataset.attributesPath || currentDataset.attributesPath;
        currentDataset.connectorType = dataset.connectorType || currentDataset.connectorType;
        currentDataset.provider = dataset.provider || currentDataset.provider;
        if (user.id !== 'microservice') {
            currentDataset.userId = user.id || currentDataset.userId;
        }
        currentDataset.connectorUrl = dataset.connectorUrl || currentDataset.connectorUrl;
        currentDataset.tableName = tableName || currentDataset.tableName;
        currentDataset.overwrite = dataset.overwrite || dataset.dataOverwrite || currentDataset.overwrite;
        currentDataset.legend = dataset.legend || currentDataset.legend;
        currentDataset.clonedHost = dataset.clonedHost || currentDataset.clonedHost;
        currentDataset.updatedAt = new Date();
        if (user.id === 'microservice' && (dataset.status === 1 || dataset.status === 2)) {
            currentDataset.status = dataset.status === 1 ? 'saved' : 'failed';
            currentDataset.errorMessage = dataset.status === 1 ? null : dataset.errorMessage;
        }
        logger.info(`[DBACCESS-SAVE]: dataset`);
        return await currentDataset.save();
    }

    static async delete(id) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.info(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exist`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exist`);
        }
        logger.info(`[DBACCESS-DELETE]: dataset.id: ${id}`);
        return await currentDataset.remove();
    }

    static async getAll(query = {}) {
        logger.debug(`[DatasetService]: Getting all datasets`);
        const sort = query.sort || '';
        const page = query['page[number]'] ? parseInt(query['page[number]'], 10) : 1;
        const limit = query['page[size]'] ? parseInt(query['page[size]'], 10) : 10;
        const ids = query.ids ? query.ids.split(',').map(elem => elem.trim()) : [];
        const includes = query.includes ? query.includes.split(',').map(elem => elem.trim()) : [];
        const filteredQuery = DatasetService.getFilteredQuery(query, ids);
        const filteredSort = DatasetService.getFilteredSort(sort);
        const options = {
            page,
            limit,
            sort: filteredSort
        };
        logger.info(`[DBACCESS-FIND]: dataset`);
        let pages = await Dataset.paginate(filteredQuery, options);
        pages = Object.assign({}, pages);
        if (includes.length > 0) {
            pages.docs = await RelationshipsService.getRelationships(pages.docs, includes);
        }
        return pages;
    }

    static async clone(id, dataset, user) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.info(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exist`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exist`);
        }
        const newDataset = {};
        newDataset.name = `${currentDataset.name} - ${new Date().getTime()}`;
        newDataset.subtitle = currentDataset.subtitle;
        newDataset.application = dataset.application;
        newDataset.dataPath = 'data';
        newDataset.attributesPath = currentDataset.attributesPath;
        newDataset.connectorType = 'document';
        newDataset.provider = 'json';
        newDataset.connectorUrl = dataset.datasetUrl;
        newDataset.tableName = currentDataset.tableName;
        newDataset.overwrite = currentDataset.overwrite || currentDataset.dataOverwrite;
        newDataset.legend = dataset.legend;
        newDataset.clonedHost = {
            hostProvider: currentDataset.provider,
            hostUrl: dataset.datasetUrl,
            hostId: currentDataset._id,
            hostType: currentDataset.connectorType,
            hostPath: currentDataset.tableName
        };
        return await DatasetService.create(newDataset, user);
    }

    static async hasPermission(id, user) {
        let permission = true;
        const dataset = await DatasetService.get(id);
        const appPermission = dataset.application.find(datasetApp =>
            user.extraUserData.apps.find(app => app === datasetApp)
        );
        if (!appPermission) {
            permission = false;
        }
        if ((user.role === 'MANAGER') && (!dataset.userId || dataset.userId !== user.id)) {
            permission = false;
        }
        return permission;
    }

}

module.exports = DatasetService;
