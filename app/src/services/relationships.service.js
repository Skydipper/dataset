const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const INCLUDES = require('app.constants').INCLUDES;

class RelationshipsService {

    static async getResources(ids, includes) {
        logger.info(`Getting resources of ids: ${ids}`);
        let resources = includes.map(async (include) => {
            const obj = {};
            if (INCLUDES.indexOf(include) >= 0) {
                let uri = '';
                let payload = {};
                payload[include] = {
                    ids
                };
                if (include === 'vocabulary' || include === 'metadata') {
                    uri = '/dataset';
                    payload = {
                        ids
                    };
                }
                try {
                    obj[include] = await ctRegisterMicroservice.requestToMicroservice({
                        uri: `${uri}/${include}/find-by-ids`,
                        method: 'POST',
                        json: true,
                        body: payload
                    });
                } catch (e) {
                    throw new Error(e);
                }
            }
            return obj;
        });
        resources = (await Promise.all(resources)); // [array of promises]
        resources.unshift({});
        resources = resources.reduce((acc, val) => { const key = Object.keys(val)[0]; acc[key] = val[key]; return acc; }); // object with include as keys
        includes.forEach((include) => {
            if (resources[include]) {
                const data = resources[include].data;
                const result = {};
                if (data.length > 0) {
                    data.forEach(el => {
                        if (include === 'vocabulary') { // particular case of vocabulary. it changes the matching attr
                            if (Object.keys(result).indexOf(el.attributes.resource.id) < 0) {
                                result[el.attributes.resource.id] = [el];
                            } else {
                                result[el.attributes.resource.id].push(el);
                            }
                        } else {
                            if (Object.keys(result).indexOf(el.attributes.dataset) < 0) {
                                result[el.attributes.dataset] = [el];
                            } else {
                                result[el.attributes.dataset].push(el);
                            }
                        }
                    });
                }
                resources[include].data = result;
            }
        }); // into each include data shouldn't be an array but a object id:ARRAY
        return resources;
    }

    static async getRelationships(datasets, includes) {
        logger.info(`Getting relationships of datasets: ${datasets}`);
        datasets.unshift({});
        const map = datasets.reduce((acc, val) => { acc[val._id] = val; return acc; });
        const ids = Object.keys(map);
        const resources = await RelationshipsService.getResources(ids, includes);
        ids.forEach((id) => {
            includes.forEach((include) => {
                if (resources[include] && resources[include].data[id]) {
                    map[id][include] = resources[include].data[id];
                } else {
                    map[id][include] = [];
                }
            });
        });
        const relationships = Object.keys(map).map(key => map[key]);
        return relationships;
    }

    static async createVocabularies(id, vocabularies) {
        try {
            return await ctRegisterMicroservice.requestToMicroservice({
                uri: `/dataset/${id}/vocabulary`,
                method: 'POST',
                json: true,
                body: vocabularies
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    static async filterByVocabularyTag(query) {
        logger.info(`Getting resources for vocabulary-tag query`);
        let vocabularyQuery = '?';
        Object.keys(query).forEach((key => {
            if (key.indexOf('vocabulary[') >= 0) {
                vocabularyQuery += `${key.split('vocabulary[')[1].split(']')[0]}=${query[key]}&`;
            }
        }));
        vocabularyQuery = vocabularyQuery.substring(0, vocabularyQuery.length - 1);
        logger.debug(vocabularyQuery);
        const result = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/dataset/vocabulary/find${vocabularyQuery}`,
            method: 'GET',
            json: true,
        });
        const ids = result.data[0].attributes.resources.map(el => el.id);
        return ids.reduce((acc, next) => `${acc}, ${next}`);
    }

}

module.exports = RelationshipsService;
