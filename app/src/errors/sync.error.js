
class SyncError extends Error {

    constructor(message) {
        super(message);
        this.name = 'SyncError';
        this.message = message;
    }

}

module.exports = SyncError;
