const Router = require('koa-router');
const logger = require('logger');
const DatasetService = require('services/dataset.service');
const DatasetSerializer = require('serializers/dataset.serializer');

const router = new Router({
    prefix: '/dataset',
});

class DatasetRouter {

    static async get(ctx) {
        logger.info(`Getting dataset with id: ${ctx.params.id}`);
        const dataset = await DatasetService.get(ctx.params.id);
        ctx.body = DatasetSerializer.serialize(dataset);
    }

    static async create(ctx) {
        ctx.body = {
            hi: 'hi'
        };
    }

    static async update(ctx) {
        ctx.body = {
            hi: 'hi'
        };
    }

    static async delete(ctx) {
        ctx.body = {
            hi: 'hi'
        };
    }

    static async getAll(ctx) {
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
router.get('/dataset/:dataset', DatasetRouter.get);
router.post('/dataset/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.create);
router.patch('/dataset/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.update);
router.delete('/dataset/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.delete);
router.post('/dataset/:dataset/clone', validationMiddleware, authorizationMiddleware, DatasetRouter.clone);

module.exports = router;
