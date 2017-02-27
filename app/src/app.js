const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const config = require('config');
const loader = require('loader');
const mongoose = require('mongoose');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const ErrorSerializer = require('serializers/error.serializer');
const mongoUri = process.env.MONGO_URI || 'mongodb://' + config.get('mongodb.host') + ':' + config.get('mongodb.port') + '/' + config.get('mongodb.database');

const koaBody = require('koa-body')({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb'
});

const onDbReady = (err) => {

    if (err) {
        logger.error(err);
        throw new Error(err);
    }

    const app = new Koa();

    app.use(koaBody);

    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            let error = err;
            try {
                error = JSON.parse(err);
            } catch (e) {
                logger.error('Error parse');
            }
            ctx.status = error.status || 500;
            logger.error(error);
            ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
            if (process.env.NODE_ENV === 'prod' && this.status === 500) {
                ctx.body = 'Unexpected error';
            }
            ctx.response.type = 'application/vnd.api+json';
        }
    });

    app.use(koaLogger());

    loader.loadRoutes(app);


    app.listen(process.env.PORT, () => {
        ctRegisterMicroservice.register({
            info: require('../microservice/register.json'),
            swagger: require('../microservice/public-swagger.json'),
            mode: process.env.NODE_ENV === 'dev' ? ctRegisterMicroservice.MODE_AUTOREGISTER : ctRegisterMicroservice.MODE_NORMAL,
            framework: ctRegisterMicroservice.KOA2,
            app,
            logger,
            name: config.get('service.name'),
            ctUrl: process.env.CT_URL,
            url: process.env.LOCAL_URL,
            token: process.env.CT_TOKEN,
            active: true,
        }).then(() => {}, (error) => {
            logger.error(error);
            process.exit(1);
        });
    });
    logger.info('Server started in ', process.env.PORT);
};

mongoose.connect(mongoUri, onDbReady);

// module.exports = instance;
