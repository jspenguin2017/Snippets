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

const fs = require("fs");
const path = require("path");
const stream = require("stream");
const zlib = require("zlib");

// --------------------------------------------------------------------------------------------- //

const aws = require("aws-sdk");

const s3 = new aws.S3();
const s3a = new aws.S3({ credentials: false });

// --------------------------------------------------------------------------------------------- //

const Abort = (err) => {
    if (typeof err !== "object" || err === null || typeof err.stack !== "string")
        return void Abort(new Error("An error occurred while handling another error"));

    console.error(err.stack);
    process.exit(1);
};

// --------------------------------------------------------------------------------------------- //

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

const CreateReadStream = (bucket, key, sign) => {
    S3RequestValidator(bucket, key);

    const params = {
        Bucket: bucket,
        Key: key,
    };

    return (sign ? s3 : s3a).getObject(params, S3ResponseHandler).createReadStream();
};

const CreateWriteStream = (bucket, key) => {
    S3RequestValidator(bucket, key);

    const s = new stream.PassThrough();

    const params = {
        Bucket: bucket,
        Key: key,
        Body: s,
    };

    s3.upload(params, S3ResponseHandler);

    return s;
};

// --------------------------------------------------------------------------------------------- //

const CreateGunzipStream = (s) => {
    return s.pipe(zlib.createGunzip());
};

const CreateLineIterator = (s, handler, finish) => {

    // ----------------------------------------------------------------------------------------- //

    let data = "";

    const dispatch = () => {
        while (data.length > 0) {
            const i = data.indexOf("\r\n");
            if (i === -1)
                break;

            const temp = data.substring(0, i);
            data = data.substring(i + 2);
            handler(temp);
        }
    };

    // ----------------------------------------------------------------------------------------- //

    s.setEncoding("utf8");

    s.on("data", (chunk) => {
        data += chunk;
        dispatch();
    });

    s.on("end", () => {
        dispatch();

        if (data.length > 0) {
            const temp = data;
            data = "";
            handler(temp);
        }

        if (typeof finish === "function")
            finish();
    });

    // ----------------------------------------------------------------------------------------- //

    s.on("error", (err) => {
        Abort(err);
    });

    // ----------------------------------------------------------------------------------------- //

};

// --------------------------------------------------------------------------------------------- //

// processor(line, write)

const LoadProprietaryCode = async (install = false) => {
    try {
        return require("./processor.js");
    } catch (err) {
        console.warn("Proprietary code not packaged! This can degrade performance.");
    }

    const code = await new Promise((resolve, reject) => {

        // ------------------------------------------------------------------------------------- //

        let buf = "";

        const s = CreateReadStream("lambda-storage-0", "processor.js", true);

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

const Main = async (event) => {
    if (typeof event.Bucket !== "string")
        event.Bucket = "commoncrawl";

    const processor = await LoadProprietaryCode();

    const zip = CreateReadStream(event.Bucket, event.Key, event.Bucket !== "commoncrawl");
    const text = CreateGunzipStream(zip);
    const write = CreateWriteStream(
        "temp-storage-0",
        "net-scan-data/" + path.basename(event.Key, ".warc.gz") + ".csv",
    );

    return new Promise((resolve, reject) => {
        CreateLineIterator(
            text,
            (line) => {
                processor(line, write);
            },
            () => {
                write.end(() => {
                    resolve();
                });
            },
        );
    });
};

// --------------------------------------------------------------------------------------------- //

exports.handler = Main;

if (require.main === module) {
    if (process.argv[2] === "--install")
        LoadProprietaryCode(true);
    else
        Main({ Key: process.argv[2] });
}

// --------------------------------------------------------------------------------------------- //
