// --------------------------------------------------------------------------------------------- //

// Copyright (c) 2018 Hugo Xu
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// --------------------------------------------------------------------------------------------- //

// Net scan open source portion

// --------------------------------------------------------------------------------------------- //

"use strict";

const assert = require("assert");
const fs = require("fs");
const zlib = require("zlib");

// --------------------------------------------------------------------------------------------- //

const aws = require("aws-sdk");
const s3 = new aws.S3();

// --------------------------------------------------------------------------------------------- //

const Abort = (err) => {
    console.log(err.stack);
    process.exit(1);
};

const S3RequestValidator = (bucket, key) => {
    if (typeof bucket !== "string")
        Abort(new Error("Bucket name must be a string"));

    if (typeof key !== "string")
        Abort(new Error("Key name must be a string"));
};

const S3ResponseHandler = (err, data) => {
    if (err)
        Abort(err);

    void data; // Not used
};

// --------------------------------------------------------------------------------------------- //

const CreateReadStream = (bucket, key) => {
    S3RequestValidator(bucket, key);

    const params = {
        Bucket: bucket,
        Key: key,
    };

    return s3.getObject(params, S3ResponseHandler).createReadStream();
};

const CreateWriteStream = (bucket, key) => {
    S3RequestValidator(bucket, key);

    const s = new stream.PassThrough();

    const params = {
        Bucket: bucket,
        Key: key,
        Body: s,
    };

    s3.putObject(params, handler);

    return s;
};

// --------------------------------------------------------------------------------------------- //

const CreateGunzipStream = (stream) => {
    return stream.pipe(zlib.createGunzip());
};

const CreateLineIterator = (stream, handler) => {

};

// --------------------------------------------------------------------------------------------- //

// processor(line, stream)

const LoadProprietaryCode = async (install = false) => {
    try {
        return require("./processor.js");
    } catch {
        console.warn("Proprietary code not packaged! This can degrade performance.");
    }

    const code = new Promise((resolve, reject) => {

        // ------------------------------------------------------------------------------------- //

        let buf = "";

        const s = CreateReadStream("lambda-storage-0", "process.js");

        // ------------------------------------------------------------------------------------- //

        s.setEncoding("utf8");

        s.on("data", (chunk) => {
            buf += chunk;
        });

        s.on("end", () => {
            resolve(buf);
        });

        // ------------------------------------------------------------------------------------- //

        s.on("error", (err) => {
            Abort(err);
        });

        // ------------------------------------------------------------------------------------- //

    });

    // This can be done asynchronously
    if (install) {
        fs.writeFile("./processor.js", "module.exports = " + code, "utf8", (err) => {
            if (err)
                console.error("Could not install proprietary code to package!");
        });
    }

    return eval(code);
};

// --------------------------------------------------------------------------------------------- //

const Handler = async (event) => {

};

// --------------------------------------------------------------------------------------------- //

exports.handler = Handler;

if (require.main === module) {
    if (process.argv[2] === "--install") {
        LoadProprietaryCode(true);
    } else {
        Handler({
            Bucket: "",
            Key: process.argv[2],
        });
    }
}

// --------------------------------------------------------------------------------------------- //
