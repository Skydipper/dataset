const logger = require('logger');
const Dataset = require('models/dataset.model');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');

class DatasetService {

    static getSlug(name) {
        const slug = name; // @TODO
        return slug;
    }

    static getFilteredQuery(query) {
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

    static async get(id) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.warn(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const dataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!dataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exists`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exists`);
        }
        return dataset;
    }

    static async create(dataset, user) {
        logger.debug(`[DatasetService]: Getting dataset with name:  ${dataset.name}`);
        logger.warn(`[DBACCES-FIND]: dataset.name: ${dataset.name}`);
        const currentDataset = await Dataset.findOne({
            slug: DatasetService.getSlug(dataset.name)
        });
        if (currentDataset) {
            logger.error(`[DatasetService]: Dataset with name ${dataset.name} already exists`);
            throw new DatasetDuplicated(`Dataset with name '${dataset.name}' already exists`);
        }
        logger.warn(`[DBACCESS-SAVE]: dataset.name: ${dataset.name}`);
        return await new Dataset({
            name: dataset.name,
            slug: DatasetService.getSlug(dataset.name),
            type: dataset.type,
            subtitle: dataset.subtitle,
            application: dataset.application,
            dataPath: dataset.dataPath,
            attributesPath: dataset.attributesPath,
            connectorType: dataset.connectorType,
            provider: dataset.provider,
            userId: user.id,
            connectorUrl: dataset.connectorUrl,
            tableName: dataset.tableName,
            overwrite: dataset.overwrite,
            legend: dataset.legend,
            dataset: dataset.clonedHost
        }).save();
    }

    static async update(id, dataset, user) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.warn(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exists`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exists`);
        }
        const slug = DatasetService.getSlug(dataset.name);
        const query = {
            slug
        };
        logger.warn(`[DBACCESS-FIND]: dataset.name - ${dataset.name}`);
        const otherDataset = await Dataset.findOne(query).exec();
        if (otherDataset) {
            logger.error(`[DatasetService]: Dataset with name ${dataset.name} generate an existing dataset slug ${slug}`);
            throw new DatasetDuplicated(`Dataset with name '${dataset.name}' generate an existing dataset '${slug}'`);
        }
        currentDataset.name = dataset.name ? dataset.name : currentDataset.name;
        currentDataset.slug = slug || currentDataset.slug;
        currentDataset.subtitle = dataset.subtitle ? dataset.subtitle : currentDataset.subtitle;
        currentDataset.application = dataset.application ? dataset.application : currentDataset.application;
        currentDataset.dataPath = dataset.dataPath ? dataset.dataPath : currentDataset.dataPath;
        currentDataset.attributesPath = dataset.attributesPath ? dataset.attributesPath : currentDataset.attributesPath;
        currentDataset.connectorType = dataset.connectorType ? dataset.connectorType : currentDataset.connectorType;
        currentDataset.provider = dataset.provider ? dataset.provider : currentDataset.provider;
        currentDataset.userId = user.id ? user.id : currentDataset.userId;
        currentDataset.connectorUrl = dataset.connectorUrl ? dataset.connectorUrl : currentDataset.connectorUrl;
        currentDataset.tableName = dataset.tableName ? dataset.tableName : currentDataset.tableName;
        currentDataset.overwrite = dataset.overwrite ? dataset.overwrite : currentDataset.overwrite;
        currentDataset.legend = dataset.legend ? dataset.legend : currentDataset.legend;
        currentDataset.clonedHost = dataset.clonedHost ? dataset.clonedHost : currentDataset.clonedHost;
        currentDataset.updatedAt = new Date();
        return await currentDataset.save();
    }

    static async delete(id) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.warn(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exists`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exists`);
        }
        logger.warn(`[DBACCESS-DELETE]: dataset.id: ${id}`);
        return await currentDataset.remove();
    }

    static async getAll(query = {}) {
        logger.debug(`[DatasetService]: Getting all datasets`);
        const sort = query.sort || '';
        const page = query['page[number]'] ? parseInt(query['page[number]'], 10) : 1;
        const limit = query['page[size]'] ? parseInt(query['page[size]'], 10) : 10;
        const filteredQuery = DatasetService.getFilteredQuery(query);
        const filteredSort = DatasetService.getFilteredSort(sort);
        const options = {
            page,
            limit,
            sort: filteredSort
        };
        logger.warn(`[DBACCESS-FIND]: dataset`);
        return await Dataset.paginate(filteredQuery, options);
    }

    static async clone() {
        return await true;
    }

}

module.exports = DatasetService;
