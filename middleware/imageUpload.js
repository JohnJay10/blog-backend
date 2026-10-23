const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
const maximumFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maximumFileSize, files: 1, fields: 5, fieldSize: 55 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(new Error('Choose a JPEG, PNG, WebP, or GIF image.'));
        }
        callback(null, true);
    },
});

const uploadImage = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (!error) return next();
        const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({
            message: status === 413 ? 'Image must be 5 MB or smaller.' : error.message,
        });
    });
};

function getImageExtension(file) {
    const { buffer, mimetype } = file;

    if (mimetype === 'image/jpeg' && buffer.length >= 3
        && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
    if (mimetype === 'image/png' && buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
    if (mimetype === 'image/gif' && buffer.length >= 6
        && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return '.gif';
    if (mimetype === 'image/webp' && buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
    return null;
}

async function saveImage(file) {
    if (!file) return null;
    const extension = getImageExtension(file);
    if (!extension) {
        const error = new Error('The selected file is not a supported image.');
        error.status = 400;
        throw error;
    }

    await fs.mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: 'wx' });
    return `/uploads/${filename}`;
}

async function deleteImage(imagePath) {
    if (typeof imagePath !== 'string') return;
    const match = /^\/uploads\/([a-f0-9-]+\.(?:jpg|png|gif|webp))$/i.exec(imagePath);
    if (!match) return;
    await fs.unlink(path.join(uploadDirectory, path.basename(match[1]))).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
    });
}

module.exports = { uploadImage, saveImage, deleteImage, uploadDirectory };
