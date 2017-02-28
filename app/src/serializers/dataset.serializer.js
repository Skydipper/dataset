
class DatasetSerializer {

    static serialize(data, link = null) {
        const result = {
            data: []
        };
        if (data) {
            let arrayData = data;
            if (data.docs) {
                arrayData = data.docs;
            }
            if (!Array.isArray(arrayData)) {
                arrayData = [data];
            }
            arrayData.forEach((el) => {
                result.data.push({
                    id: el._id,
                    type: 'dataset',
                    attributes: {
                        name: el.name
                    }
                });
            });
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
