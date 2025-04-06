// server/utils/gridfs-helper.js
const mongoose = require('mongoose');
const { Readable } = require('stream');

// Initialize GridFS bucket
let gridfsBucket;

// Initialize when mongoose is connected
mongoose.connection.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'profile_images'
    });
    console.log('GridFS bucket initialized');
});

// Function to upload a file to GridFS
async function uploadFileToGridFS(fileData, fileName, mimeType, metadata = {}) {
    return new Promise((resolve, reject) => {
        if (!gridfsBucket) {
            return reject(new Error('GridFS bucket not initialized'));
        }

        // Create a readable stream from the file buffer
        const readableStream = new Readable();
        readableStream.push(fileData);
        readableStream.push(null); // Signal the end of the stream

        // Create upload stream
        const uploadStream = gridfsBucket.openUploadStream(fileName, {
            contentType: mimeType,
            metadata
        });

        // Handle upload completion
        uploadStream.on('finish', function () {
            resolve(uploadStream.id);
        });

        // Handle errors
        uploadStream.on('error', function (error) {
            reject(error);
        });

        // Pipe data to GridFS
        readableStream.pipe(uploadStream);
    });
}

// Function to stream a file from GridFS
function getFileStream(fileId) {
    if (!gridfsBucket) {
        throw new Error('GridFS bucket not initialized');
    }

    return gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

// Function to delete a file from GridFS
async function deleteFileFromGridFS(fileId) {
    if (!gridfsBucket) {
        throw new Error('GridFS bucket not initialized');
    }

    return gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
}

// Function to find a file by ID
async function findFileById(fileId) {
    if (!gridfsBucket) {
        throw new Error('GridFS bucket not initialized');
    }

    const files = await gridfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files[0] || null;
}

module.exports = {
    uploadFileToGridFS,
    getFileStream,
    deleteFileFromGridFS,
    findFileById
};