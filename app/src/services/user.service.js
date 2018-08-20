const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class UserService {

    static async getUsersWithRole(role) {
        const body = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/auth/user/ids/${role}`,
            method: 'GET',
            json: true,
            version: false
        });
        logger.debug('User ids', body.data);
        return body.data;
    }

}

module.exports = UserService;
