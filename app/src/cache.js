const toArray = require('stream-to-array');
const isJSON = require('koa-is-json');
const bytes = require('bytes');
const redis = require('redis');
const etag = require('etag');
require('bluebird').promisifyAll(redis.RedisClient.prototype);
// methods we cache
const methods = {
    HEAD: true,
    GET: true
};

module.exports = function (options) {
    options = options || {};

    if (!options.redisUrl) {
        process.exit(1);
    }
    if (!options.prefix) {
        process.exit(1);
    }
    if (!options.maxAge) {
        options.maxAge = 24 * 60 * 60;
    }

    const client = redis.createClient(options.redisUrl);

    const hash = options.hash || function (ctx) {
        return ctx.request.url;
    };

    let threshold = options.threshold || '1kb';
    if (typeof threshold === 'string') {
        threshold = bytes(threshold);
    }
    const get = async (key) => {
        const value = await client.getAsync(`${options.prefix}:${key}`);
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value);
        } catch (err) {
            return null;
        }
    };
    const set = (key, value, maxAge) => {
        if (key.startsWith('/info')) {
            return;
        }
        if (isJSON(value)) {
            client.set(`${options.prefix}:${key}`, JSON.stringify(value), 'EX', maxAge);
        } else {
            client.set(`${options.prefix}:${key}`, value, 'EX', maxAge);
        }
    };

    // ctx.cashed(maxAge) => boolean
    const cashed = async function cashed(ctx) {
        // uncacheable request method
        if (!methods[ctx.request.method] || ctx.request.headers['cache-control']==='no-cache') return false;

        const key = ctx.cashKey = hash(ctx);
        const obj = await get(key, options.maxAge || 0);
        const body = obj && obj.body;
        if (!body) {
            return false;
        }

        // serve from cache
        ctx.response.type = obj.type;
        if (obj.lastModified) ctx.response.lastModified = obj.lastModified;
        if (obj.etag) ctx.set('etag', obj.etag);

        ctx.response.body = obj.body;
        // tell any compress middleware to not bother compressing this
        ctx.response.set('Content-Encoding', 'identity');

        return true;
    };

    const flushCache = async () => {
        try {
            const keys = await client.keysAsync(`${options.prefix}:*`);
            if (keys && keys.length > 0) {
                client.del(keys);
            }
        } catch(err) {

        }        
    }

    // the actual middleware
    return async function cash(ctx, next) {
        ctx.vary('Accept-Encoding');
        
        const cached = await cashed(ctx, options.maxAge);
        if (cached) {
            return;
        }
        
        await next();
        
        // cache the response
        // only cache GET/HEAD 200s
        if (ctx.response.status !== 200) return;
        if (!methods[ctx.request.method]) {
            await flushCache();
        }
        let body = ctx.response.body;
        if (!body) return;

        // stringify JSON bodies
        if (isJSON(body)) body = ctx.response.body = JSON.stringify(body);
        // buffer streams
        if (typeof body.pipe === 'function') {
            // note: non-binary streams are NOT supported!
            body = ctx.response.body = Buffer.concat(await toArray(body));
        }

        const obj = {
            body,
            type: ctx.response.get('Content-Type') || null,
            lastModified: ctx.response.lastModified || null,
            etag: etag(body)
        };

        if (!ctx.response.get('Content-Encoding')) ctx.response.set('Content-Encoding', 'identity');
        if (ctx.cashKey) {
            await set(ctx.cashKey, obj, options.maxAge);
        }
    };
};
