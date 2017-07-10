const logger = require('logger');
const Stampery = require('stampery');
const config = require('config');

class VerificationService {

    constructor() {
        this.stampery = new Stampery(config.get('stampery'));
    }

    async getVerificationData(id) {
        logger.debug('Getting verification data');
        return new Promise((resolve, reject) => {
            this.stampery.getById(id, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
    }

}

module.exports = new VerificationService();
