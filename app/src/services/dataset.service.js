const logger = require('logger');
const Dataset = require('models/dataset.model');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');

class DatasetService {

    static getSlug(name) {
        const slug = name; // @TODO
        return slug;
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

    static async delete(id, user) {
        logger.debug(`[DatasetService]: Getting dataset with id:  ${id}`);
        logger.warn(`[DBACCESS-FIND]: dataset.id: ${id}`);
        const currentDataset = await Dataset.findById(id).exec() || await Dataset.findOne({ slug: id }).exec();
        if (!currentDataset) {
            logger.error(`[DatasetService]: Dataset with id ${id} doesn't exists`);
            throw new DatasetNotFound(`Dataset with id '${id}' doesn't exists`);
        }
        logger.warn(`[DBACCESS-DELETE]: dataset.id: ${id}`);
        return await currentDataset.delete();
    }

    static async getAll(query) {
        return await true;
    }

    static async clone(datasetId, user) {
        return await true;
    }

}

module.exports = DatasetService;
