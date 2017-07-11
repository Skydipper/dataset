
class DatasetSerializer {

    static serializeElement(el) {
        return {
            id: el._id,
            type: 'dataset',
            attributes: {
                name: el.name,
                slug: el.slug,
                type: el.type,
                subtitle: el.subtitle,
                application: el.application,
                dataPath: el.dataPath,
                attributesPath: el.attributesPath,
                connectorType: el.connectorType,
                provider: el.provider,
                userId: el.userId,
                connectorUrl: el.connectorUrl,
                tableName: el.tableName,
                status: el.status,
                published: el.published,
                overwrite: el.overwrite,
                verified: el.verified,
                blockchain: el.blockchain,
                subscribable: el.subscribable,
                legend: el.legend,
                clonedHost: el.clonedHost,
                errorMessage: el.errorMessage,
                createdAt: el.createdAt,
                updatedAt: el.updatedAt,
                metadata: el.metadata,
                widget: el.widget,
                layer: el.layer,
                vocabulary: el.vocabulary,
                widgetRelevantProps: el.widgetRelevantProps,
                layerRelevantProps: el.layerRelevantProps
            }
        };
    }

    static serialize(data, link = null) {
        const result = {};
        if (data) {
            if (data.docs) {
                result.data = data.docs.map(el => DatasetSerializer.serializeElement(el));
            } else {
                if (Array.isArray(data)) {
                    result.data = DatasetSerializer.serializeElement(data[0]);
                } else {
                    result.data = DatasetSerializer.serializeElement(data);
                }
            }
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
