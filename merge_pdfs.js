// Licensed under CC0-1.0
//
// Merge all PDF files in a directory into one file, sorted by file name

"use strict";

const cp = require("child_process");
const fs = require("fs");

let input = process.argv[2];
let output = process.argv[3];

if (!input || !output) {
    console.log("Usage:");
    console.log("    node merge_pdfs.js input_dir output_file");
    process.exit(1);
}

input = input.trim();
output = output.trim();

let list = fs.readdirSync(input);
list = list.sort().filter(elem => {
    if (elem === output) {
        console.log("Input files list contains the output file. Aborting.");
        process.exit(1);
    }

    if (elem.endsWith(".pdf")) {
        return true;
    } else {
        console.log("Ignoring non-pdf entry: " + elem);
        return false;
    }
});

console.log("Merging these PDF files:");
console.log(list);

list.push(output);

console.log("Starting to execute command.");
const result = cp.spawnSync("pdfunite", list);
console.log("Finished, result:");
console.log(result);

console.log("If it did not work, try to install pdfunite:");
console.log("    sudo apt install poppler-utils");
console.log("Also, some PDF files (such as encrypted ones) are not supported pdfunite.");
