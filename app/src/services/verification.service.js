const logger = require('logger');
const Stampery = require('stampery');
const config = require('config');

class VerificationService {

    constructor() {
        this.stampery = new Stampery(config.get('stampery'));
    }

    async getVerificationData(id) {
        logger.debug('Getting verification data');
        return this.stampery.getById(id);
    }

}

module.exports = new VerificationService();
