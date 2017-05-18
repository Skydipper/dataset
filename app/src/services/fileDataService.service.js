const logger = require('logger');
const fs = require('fs');
const os = require('os');
const s3 = require('s3');
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

const S3Client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
    }
});

class FileDataService {

    static async uploadFileToS3() {
        // bucket -> @TODO need to create one
        logger.error('uploading');
        return true;
    }

    static async removeFromTempDirectory() {
        return true;
    }

    static async cleanTemporaryDirectory() {
        // cron job to clean the temp directory
        // @TODO pattern upload_*
        return true;
    }

}

module.exports = FileDataService;
