const Router = require('koa-router');
const logger = require('logger');
const DatasetService = require('services/dataset.service');
const DatasetSerializer = require('serializers/dataset.serializer');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');

const router = new Router({
    prefix: '/dataset',
});

class DatasetRouter {

    static getUser(ctx) {
        return Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
    }

    static async get(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Getting dataset with id: ${id}`);
        try {
            const dataset = await DatasetService.get(id);
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
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetDuplicated) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async update(ctx) {
        const datasetId = ctx.params.dataset;
        logger.info(`[DatasetRouter] Updating dataset with id: ${datasetId}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const dataset = await DatasetService.update(datasetId, ctx.request.body, user);
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
        ctx.body = {
            hi: 'hi'
        };
    }

    static async getAll(ctx) {
        logger.info(`Getting datasets`);
        ctx.body = {
            hi: 'hi'
        };
    }

    static async clone(ctx) {
        ctx.body = {
            hi: 'hi'
        };
    }

}

const validationMiddleware = async (ctx, next) => {
    try {
        logger.debug('validating');
    } catch (err) {
        throw err;
    }
    await next();
};

const authorizationMiddleware = async (ctx, next) => {
    try {
        logger.debug('auth');
    } catch (err) {
        throw err;
    }
    await next();
};

router.get('/', DatasetRouter.getAll);
router.post('/', validationMiddleware, authorizationMiddleware, DatasetRouter.create);

router.get('/:dataset', DatasetRouter.get);
router.patch('/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.update);
router.delete('/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.delete);
router.post('/:dataset/clone', validationMiddleware, authorizationMiddleware, DatasetRouter.clone);

module.exports = router;
