const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GraphService {

    static async createDataset(id) {
        logger.debug('[GraphService]: Creating dataset in graph');
        try {
            return await ctRegisterMicroservice.requestToMicroservice({
                uri: `/graph/dataset/${id}`,
                method: 'POST',
                json: true
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    static async deleteDataset(id) {
        logger.debug('[GraphService]: Deleting dataset in graph');
        try {
            return await ctRegisterMicroservice.requestToMicroservice({
                uri: `/graph/dataset/${id}`,
                method: 'DELETE',
                json: true
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    static async associateTags(id, vocabularies) {
        logger.debug('[GraphService]: Associating tags in graph');
        try {
            let tags = [];
            Object.keys(vocabularies).map((key) => {
                tags = tags.concat(vocabularies[key].tags);
                return null;
            });
            return await ctRegisterMicroservice.requestToMicroservice({
                uri: `/graph/dataset/${id}/associate`,
                method: 'POST',
                json: true,
                body: {
                    tags
                }
            });
        } catch (e) {
            logger.error(e);
            throw new Error(e);
        }
    }

}

module.exports = GraphService;
