const Router = require('koa-router');

const router = new Router({
    prefix: '/dataset',
});

class DatasetRouter {

    static getAll(ctx) {
        ctx.body = {
            hi: 'hi'
        };
    }

}

router.get('/hi', DatasetRouter.getAll);

module.exports = router;
