const fs = require('fs');
const Router = require('koa-router');
const koaMulter = require('koa-multer');
const logger = require('logger');
const DatasetService = require('services/dataset.service');
const VerificationService = require('services/verification.service');
const RelationshipsService = require('services/relationships.service');
const UserService = require('services/user.service');
const FileDataService = require('services/fileDataService.service');
const DatasetValidator = require('validators/dataset.validator');
const DatasetSerializer = require('serializers/dataset.serializer');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');
const DatasetProtected = require('errors/datasetProtected.error');
const DatasetNotValid = require('errors/datasetNotValid.error');
const ConnectorUrlNotValid = require('errors/connectorUrlNotValid.error');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const USER_ROLES = require('app.constants').USER_ROLES;

const router = new Router({
    prefix: '/dataset',
});

koaMulter({ dest: 'uploads/' });

const serializeObjToQuery = (obj) => Object.keys(obj).reduce((a, k) => {
    a.push(`${k}=${encodeURIComponent(obj[k])}`);
    return a;
}, []).join('&');

class DatasetRouter {

    static getUser(ctx) {
        let user = Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
        if (ctx.request.body.fields) {
            user = Object.assign(user, JSON.parse(ctx.request.body.fields.loggedUser));
        }
        return user;
    }

    static notifyAdapter(ctx, dataset) {
        const connectorType = dataset.connectorType;
        const provider = dataset.provider;
        const clonedDataset = Object.assign({}, dataset.toObject());
        clonedDataset.id = dataset._id;
        clonedDataset.connector_url = dataset.connectorUrl;
        clonedDataset.attributes_path = dataset.attributesPath;
        clonedDataset.data_columns = dataset.datasetAttributes;
        clonedDataset.data_path = dataset.dataPath;
        clonedDataset.table_name = dataset.tableName;
        clonedDataset.data = ctx.request.body.data;
        let uri = '';
        if (connectorType === 'rest') {
            uri += `/rest-datasets/${provider}`;
        } else if (connectorType === 'document') {
            if (ctx.request.path.indexOf('clone') >= 0) {
                clonedDataset.connector_url = process.env.CT_URL + dataset.connector_url;
                clonedDataset.connectorUrl = process.env.CT_URL + dataset.connectorUrl;
            }
            uri += `/doc-datasets/${provider}`;
        }

        if (ctx.request.method === 'DELETE') {
            uri += `/${dataset.id}`;
        }

        const method = ctx.request.method === 'DELETE' ? 'DELETE' : 'POST';

        ctRegisterMicroservice.requestToMicroservice({
            uri,
            method,
            json: true,
            body: { connector: clonedDataset }
        });
    }

    static async get(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Getting dataset with id: ${id}`);
        const query = ctx.query;
        delete query.loggedUser;
        try {
            const dataset = await DatasetService.get(id, query);
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetNotFound) {
                ctx.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static async create(ctx) {
        logger.info(`[DatasetRouter] Creating dataset with name: ${ctx.request.body.name}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const dataset = await DatasetService.create(ctx.request.body, user);
            try {
                DatasetRouter.notifyAdapter(ctx, dataset);
            } catch (error) {
                // do nothing
            }
            ctx.set('cache-control', 'flush');
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetDuplicated) {
                ctx.throw(400, err.message);
                return;
            } else if (err instanceof ConnectorUrlNotValid) {
                ctx.throw(400, err.message);
            }
            throw err;
        }
    }

    static async update(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Updating dataset with id: ${id}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const dataset = await DatasetService.update(id, ctx.request.body, user);
            ctx.set('cache-control', 'flush');
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetNotFound) {
                ctx.throw(404, err.message);
                return;
            } else if (err instanceof DatasetDuplicated) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async delete(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Deleting dataset with id: ${id}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const dataset = await DatasetService.delete(id, user);
            try {
                DatasetRouter.notifyAdapter(ctx, dataset);
            } catch (error) {
                // do nothing
            }
            ctx.set('cache-control', 'flush');
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetNotFound) {
                ctx.throw(404, err.message);
                return;
            }
            if (err instanceof DatasetProtected) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async findByIds(ctx) {
        logger.info(`[DatasetRouter] Getting all datasets with ids`, ctx.request.body);
        if (ctx.request && ctx.request.body && ctx.request.body && ctx.request.body.ids.length > 0) {
            ctx.query.ids = ctx.request.body.ids.join(',');
            await DatasetRouter.getAll(ctx);
        } else {
            ctx.body = {
                data: []
            };
        }

    }

    static async getAll(ctx) {
        logger.info(`[DatasetRouter] Getting all datasets`);
        const query = ctx.query;
        const userId = ctx.query.loggedUser && ctx.query.loggedUser !== 'null' ? JSON.parse(ctx.query.loggedUser).id : null;
        delete query.loggedUser;
        if (Object.keys(query).find(el => el.indexOf('vocabulary[') >= 0)) {
            ctx.query.ids = await RelationshipsService.filterByVocabularyTag(query);
            logger.debug('Ids from vocabulary-tag', ctx.query.ids);
        }
        if (Object.keys(query).find(el => el.indexOf('user.role') >= 0)) {
            logger.debug('Obtaining users with role');
            ctx.query.usersRole = await UserService.getUsersWithRole(ctx.query['user.role']);
            logger.debug('Ids from users with role', ctx.query.usersRole);
        }
        if (Object.keys(query).find(el => el.indexOf('collection') >= 0)) {
            if (!userId) {
                ctx.throw(403, 'Collection filter not authorized');
                return;
            }
            ctx.query.ids = await RelationshipsService.getCollections(ctx.query.collection, userId);
            ctx.query.ids = ctx.query.ids.length > 0 ? ctx.query.ids.join(',') : '';
            logger.debug('Ids from collections', ctx.query.ids);
        }
        if (Object.keys(query).find(el => el.indexOf('favourite') >= 0)) {
            if (!userId) {
                ctx.throw(403, 'Fav filter not authorized');
                return;
            }
            const app = ctx.query.app || ctx.query.application || 'rw';
            ctx.query.ids = await RelationshipsService.getFavorites(ctx.query.app, userId);
            ctx.query.ids = ctx.query.ids.length > 0 ? ctx.query.ids.join(',') : '';
            logger.debug('Ids from collections', ctx.query.ids);
        }
        // Links creation
        const clonedQuery = Object.assign({}, query);
        delete clonedQuery['page[size]'];
        delete clonedQuery['page[number]'];
        delete clonedQuery.ids;
        const serializedQuery = serializeObjToQuery(clonedQuery) ? `?${serializeObjToQuery(clonedQuery)}&` : '?';
        const apiVersion = ctx.mountPath.split('/')[ctx.mountPath.split('/').length - 1];
        const link = `${ctx.request.protocol}://${ctx.request.host}/${apiVersion}${ctx.request.path}${serializedQuery}`;
        const datasets = await DatasetService.getAll(query);
        ctx.body = DatasetSerializer.serialize(datasets, link);
    }

    static async clone(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Cloning dataset with id: ${id}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const fullCloning = ctx.query.full === 'true';
            const dataset = await DatasetService.clone(id, ctx.request.body, user, fullCloning);
            try {
                DatasetRouter.notifyAdapter(ctx, dataset);
            } catch (error) {
                // do nothing
            }
            ctx.set('cache-control', 'flush');
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetDuplicated) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async upload(ctx) {
        logger.info(`[DatasetRouter] Uploading new file`);
        try {
            const filename = `${Date.now()}_${ctx.request.body.files.dataset.name}`;
            await FileDataService.uploadFileToS3(ctx.request.body.files.dataset.path, filename, true);
            const fields = await FileDataService.getFields(ctx.request.body.files.dataset.path, ctx.request.body.fields.provider);
            ctx.body = {
                connectorUrl: `rw.dataset.raw/${filename}`,
                fields
            };
        } catch (err) {
            ctx.throw(500, 'Error uploading file');
        }
    }

    static async verification(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Getting verification with id: ${id}`);
        const query = ctx.query;
        delete query.loggedUser;
        try {
            const dataset = await DatasetService.get(id, query);
            let verificationData = { message: 'Not verification data' };
            if (dataset.verified && dataset.blockchain && dataset.blockchain.id) {
                verificationData = await VerificationService.getVerificationData(dataset.blockchain.id);
            }
            logger.debug(verificationData);
            ctx.body = verificationData;
        } catch (err) {
            ctx.throw(500, 'Error getting verification data');
            return;
        }
    }

}

const validationMiddleware = async (ctx, next) => {
    logger.info(`[DatasetRouter] Validating`);
    if (ctx.request.body.dataset) {
        ctx.request.body = Object.assign(ctx.request.body, ctx.request.body.dataset);
        delete ctx.request.body.dataset;
    }
    try {
        const newDatasetCreation = ctx.request.path === '/dataset' && ctx.request.method === 'POST';
        if (newDatasetCreation) {
            await DatasetValidator.validateCreation(ctx);
        } else if (ctx.request.path.indexOf('clone') >= 0) {
            await DatasetValidator.validateCloning(ctx);
        } else if (ctx.request.path.indexOf('upload') >= 0) {
            await DatasetValidator.validateUpload(ctx);
        } else {
            await DatasetValidator.validateUpdate(ctx);
        }
    } catch (err) {
        if (err instanceof DatasetNotValid) {
            ctx.throw(400, err.getMessages());
            return;
        }
        throw err;
    }
    await next();
};

const authorizationMiddleware = async (ctx, next) => {
    logger.info(`[DatasetRouter] Checking authorization`);
    // Get user from query (delete) or body (post-patch)
    const newDatasetCreation = ctx.request.path === '/dataset' && ctx.request.method === 'POST';
    const uploadDataset = ctx.request.path.indexOf('upload') >= 0 && ctx.request.method === 'POST';
    const user = DatasetRouter.getUser(ctx);
    if (user.id === 'microservice') {
        await next();
        return;
    }
    if (!user || USER_ROLES.indexOf(user.role) === -1) {
        ctx.throw(401, 'Unauthorized'); // if not logged or invalid ROLE -> out
        return;
    }
    if (user.role === 'USER') {
        if (!newDatasetCreation && !uploadDataset) {
            ctx.throw(403, 'Forbidden'); // if user is USER -> out
            return;
        }
    }
    const application = ctx.request.query.application ? ctx.request.query.application : ctx.request.body.application;
    if (application) {
        const appPermission = application.find(app =>
            user.extraUserData.apps.find(userApp => userApp === app)
        );
        if (!appPermission) {
            ctx.throw(403, 'Forbidden'); // if manager or admin but no application -> out
            return;
        }
    }
    const allowedOperations = newDatasetCreation || uploadDataset;
    if ((user.role === 'MANAGER' || user.role === 'ADMIN') && !allowedOperations) {
        try {
            const permission = await DatasetService.hasPermission(ctx.params.dataset, user);
            if (!permission) {
                ctx.throw(403, 'Forbidden');
                return;
            }
        } catch (err) {
            throw err;
        }
    }
    await next(); // SUPERADMIN is included here
};

const authorizationBigQuery = async (ctx, next) => {
    logger.info(`[DatasetRouter] Checking if bigquery dataset`);
    // Get user from query (delete) or body (post-patch)
    const user = DatasetRouter.getUser(ctx);
    if (ctx.request.body.provider === 'bigquery' && (user.email !== 'sergio.gordillo@vizzuality.com' && user.email !== 'raul.requero@vizzuality.com' && user.email !== 'alicia.arenzana@vizzuality.com')) {
        ctx.throw(401, 'Unauthorized'); // if not logged or invalid ROLE -> out
        return;
    }
    await next();
};

const authorizationSubscribable = async (ctx, next) => {
    logger.info(`[DatasetRouter] Checking if it can update the subscribable prop`);
    if (ctx.request.body.subscribable) {
        const user = DatasetRouter.getUser(ctx);
        if (user.email !== 'sergio.gordillo@vizzuality.com' && user.email !== 'raul.requero@vizzuality.com' && user.email !== 'alicia.arenzana@vizzuality.com') {
            ctx.throw(401, 'Unauthorized'); // if not logged or invalid ROLE -> out
            return;
        }
    }
    await next();
};

router.get('/', DatasetRouter.getAll);
router.post('/find-by-ids', DatasetRouter.findByIds);
router.post('/', validationMiddleware, authorizationMiddleware, authorizationBigQuery, DatasetRouter.create);
// router.post('/', validationMiddleware, authorizationMiddleware, authorizationBigQuery, authorizationSubscribable, DatasetRouter.create);
router.post('/upload', validationMiddleware, authorizationMiddleware, DatasetRouter.upload);

router.get('/:dataset', DatasetRouter.get);
router.get('/:dataset/verification', DatasetRouter.verification);
router.patch('/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.update);
router.delete('/:dataset', authorizationMiddleware, DatasetRouter.delete);
router.post('/:dataset/clone', validationMiddleware, authorizationMiddleware, DatasetRouter.clone);

module.exports = router;
