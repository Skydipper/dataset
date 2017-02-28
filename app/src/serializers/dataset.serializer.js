const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const datasetSerializer = new JSONAPISerializer('dataset', {
    attributes: ['name', 'slug', 'type', 'subtitle', 'application', 'dataPath',
    'attributesPath', 'connectorType', 'provider', 'userId', 'connectorUrl',
    'tableName', 'status', 'overwrite', 'legend', 'clonedHost', 'createdAt', 'updatedAt'],
    id: '_id',
    typeForAttribute: attribute => attribute,
    keyForAttribute: 'camelCase'
});

class DatasetSerializer {

    static serialize(data, link = null) {
        let result = {};
        if (data) {
            let arrayData = data;
            if (data.docs) {
                arrayData = data.docs;
            }
            if (!Array.isArray(arrayData)) {
                arrayData = [data];
            }
            result = datasetSerializer.serialize(arrayData);
        }
        if (link) {
            result.links = {
                self: `${link}page[number]=${data.page}&page[size]=${data.limit}`,
                first: `${link}page[number]=1&page[size]=${data.limit}`,
                last: `${link}page[number]=${data.pages}&page[size]=${data.limit}`,
                prev: `${link}page[number]=${data.page - 1 > 0 ? data.page - 1 : data.page}&page[size]=${data.limit}`,
                next: `${link}page[number]=${data.page + 1 < data.pages ? data.page + 1 : data.pages}&page[size]=${data.limit}`,
            };
        }
        return result;
    }

}

module.exports = DatasetSerializer;
