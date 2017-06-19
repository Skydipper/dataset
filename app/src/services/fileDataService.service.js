const logger = require('logger');
const fs = require('fs');
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
        region: 'us-east-1'
    }
});

class FileDataService {

    static async uploadFileToS3(localConnectorUrl) {
        const fileName = localConnectorUrl.split('rw.dataset.raw/tmp/')[1]
        const filePath = `/tmp/${fileName}`;
        try {
            logger.info('[SERVICE] Uploading to S3');
            const params = {
                localFile: filePath,
                s3Params: {
                    Bucket: 'wri-api-backups',
                    Key: `raw/${fileName}`,
                    ACL: 'public-read'
                }
            };
            const uploader = S3Client.uploadFile(params);
            await new Promise((resolve) => {
                uploader.on('end', data => resolve(data));
            });
            const s3file = s3.getPublicUrlHttp(params.s3Params.Bucket, params.s3Params.Key);
            // do not wait for it
            FileDataService.removeFromTempDirectory(filePath);
            return s3file;
        } catch (err) {
            throw err;
        }
    }

    static removeFromTempDirectory(filePath) {
        try {
            fs.unlink(filePath);
            FileDataService.cleanTempDirectory();
            return true;
        } catch (err) {
            return false;
        }
    }

    static cleanTempDirectory() {
        // read tmp dir
        fs.readdir('/tmp/', (_, files) => {
            // iterate over them
            files.forEach(file => {
                // upload_* (raw dataset)
                if (file.indexOf('upload_') >= 0) {
                    // stats
                    fs.stat(`/tmp/${file}`, (__, stats) => {
                        // modified time + 24 > Date now
                        if (Date.now() - 24 * 3600 > Date.parse(stats.mtime)) {
                            fs.unlink(`/tmp/${file}`);
                        }
                    });
                }
            });
        });
    }

}

module.exports = FileDataService;