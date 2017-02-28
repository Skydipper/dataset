const Router = require('koa-router');
const logger = require('logger');
const DatasetService = require('services/dataset.service');
const DatasetSerializer = require('serializers/dataset.serializer');
const DatasetDuplicated = require('errors/datasetDuplicated.error');
const DatasetNotFound = require('errors/datasetNotFound.error');
const USER_ROLES = require('app.constants').USER_ROLES;

const router = new Router({
    prefix: '/dataset',
});

const serializeObjToQuery = (obj) => Object.keys(obj).reduce((a, k) => {
    a.push(`${k}=${encodeURIComponent(obj[k])}`);
    return a;
}, []).join('&');

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
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Updating dataset with id: ${id}`);
        try {
            const user = DatasetRouter.getUser(ctx);
            const dataset = await DatasetService.update(id, ctx.request.body, user);
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
            const dataset = await DatasetService.delete(id);
            ctx.body = DatasetSerializer.serialize(dataset);
        } catch (err) {
            if (err instanceof DatasetNotFound) {
                ctx.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static async getAll(ctx) {
        logger.info(`[DatasetRouter] Getting all datasets`);
        const query = ctx.query;
        delete query.loggedUser;
        const clonedQuery = JSON.parse(JSON.stringify(query));
        delete clonedQuery['page[size]'];
        delete clonedQuery['page[number]'];
        const serializedQuery = serializeObjToQuery(clonedQuery) ? `?${serializeObjToQuery(clonedQuery)}&` : '?';
        const link = `${ctx.request.protocol}://${ctx.request.host}${ctx.request.path}${serializedQuery}`;
        const datasets = await DatasetService.getAll(query);
        ctx.body = DatasetSerializer.serialize(datasets, link);
    }

    static async clone(ctx) {
        const id = ctx.params.dataset;
        logger.info(`[DatasetRouter] Cloning dataset with id: ${id}`);
        ctx.body = {};
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
    // Get user from query (delete) or body (post-patch)
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
        ctx.throw(403, 'Forbidden'); // if user is USER -> out
        return;
    }
    // Get application from query (delete) or body (post-patch)
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        try {
            const permission = await DatasetService.hasPermission(ctx.params.dataset, user);
            if (!permission) {
                this.throw(403, 'Forbidden');
                return;
            }
        } catch (err) {
            throw err;
        }
    }
    await next(); // SUPERADMIN is included here
};

router.get('/', DatasetRouter.getAll);
router.post('/', validationMiddleware, authorizationMiddleware, DatasetRouter.create);

router.get('/:dataset', DatasetRouter.get);
router.patch('/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.update);
router.delete('/:dataset', validationMiddleware, authorizationMiddleware, DatasetRouter.delete);
router.post('/:dataset/clone', validationMiddleware, authorizationMiddleware, DatasetRouter.clone);

module.exports = router;
