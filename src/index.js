import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import {createReadStream, createWriteStream} from 'fs';
import { createHash } from 'crypto';
import zlib from 'zlib';

let username = '';
let curPath = '';
let rootDirectory = '';

const up = async () => {
    if (curPath !== rootDirectory) {
        curPath = path.parse(curPath).dir;
    }
}

const cd = async ([dir]) => {
    if (dir && dir !== '/' && dir !== '\\' && dir !== '.' && dir !== '..') {
        let pathname = curPath;
        if (!path.isAbsolute(dir)) {
            pathname = path.join(pathname, dir);
        } else pathname = dir;

        if (await checkPath(pathname)) {
            curPath = pathname;
        } else {
            printWrongInput('Wrong path');
        }
    } else {
        printWrongInput();
    }
}

const ls = async () => {
    try {
        const files = await fs.readdir(curPath);
        const filesList = [];
        const MAX_NAME_LENGTH = 60;

        for (const item of files) {
            const filePath = path.join(curPath, item);
            try {
                const stats = await fs.stat(filePath);
                filesList.push({
                    name: item,
                    shortName: item.length > MAX_NAME_LENGTH-3 ? item.slice(0, MAX_NAME_LENGTH-6) + '...' : item,
                    path: filePath,
                    type: stats.isDirectory() ? 'dir' : 'file'
                });
            } catch (err) {
                printWrongInput();
                return;
            }
        }

        filesList.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type.localeCompare(b.type);
        });

        const separatorLine = `+${'-'.repeat(7)}+${'-'.repeat(MAX_NAME_LENGTH)}+${'-'.repeat(6)}+`;
        process.stdout.write('\n');
        process.stdout.write(`${separatorLine}\n`);
        process.stdout.write(`| Index | ${' '.repeat(MAX_NAME_LENGTH / 2 - 3)}Name${' '.repeat(MAX_NAME_LENGTH / 2 - 3)} | Type |\n`);
        process.stdout.write(`${separatorLine}\n`);

        filesList.forEach((file, idx) => {
            process.stdout.write(`|  ${String(idx).padEnd(4)} | ${file.shortName.padEnd(MAX_NAME_LENGTH-2)} | ${file.type === 'dir' ? 'dir ' : 'file'} |\n`);
            process.stdout.write(`${separatorLine}\n`);
        });

    } catch (err) {
        printWrongInput();
    }
}

const read = async (params) => {
    console.log('read', params);
}

const create = async (params) => {
    console.log('create', params);
}

const rename = async (params) => {
    console.log('rename', params);
}

const copy = async (params) => {
    console.log('copy', params);
}

const move = async (params) => {
    console.log('move', params);
}

const remove = async (params) => {
    console.log('remove', params);
}

const hash = async ([filepath]) => {
    if (filepath) {
        const hash = createHash('sha256');
        if (!path.isAbsolute(filepath)) {
            filepath = path.join(curPath, filepath);
        }

        if (await checkPath(filepath)) {
            await new Promise((resolve, reject) => {
                createReadStream(filepath).on('data', (data) => {
                    hash.update(data);
                }).on('end', async () => {
                    process.stdout.write(`Hash: ${hash.digest('hex')}\n`);
                    resolve();
                });
            });
        } else {
            printWrongInput('Wrong path');
        }
    }
}

const compress = async ([origin, dest]) => {
    if (origin && (!dest || (dest !== '/' && dest !== '\\' && dest !== '.' && dest !== '..'))) {
        const originFilePath = getFullPath(origin);
        let destPath = '';
        let destFile = '';

        if (dest) {
            destPath = path.dirname(dest);
            if (destPath === '.') {
                destPath = curPath;
            }
            destFile = path.basename(dest);
        } else {
            destPath = path.dirname(originFilePath);
            destFile = path.basename(originFilePath);
        }

        destFile = `${destFile ? destFile : path.basename(originFilePath)}.br`;

        if (await checkPath(originFilePath) && await checkPath(destPath)) {
            await new Promise((resolve, reject) => {
                const readStream = createReadStream(originFilePath);
                const writeStream = createWriteStream(path.join(destPath, destFile), { flags: 'w' });
                const brotliCompress = zlib.createBrotliCompress();
                readStream.pipe(brotliCompress).pipe(writeStream);

                writeStream.on('finish', () => {
                    process.stdout.write(`File compressed successfully!\n`);
                    resolve();
                });

                writeStream.on('error', (err) => {
                    reject('Compressed error on WriteStream');
                });

                brotliCompress.on('error', (err) => {
                    reject('Compression error on BrotliCompress');
                });
            }).catch((err) => {
                printWrongInput(err);
            });
        } else {
            printWrongInput('Wrong origin or destination path');
        }
    } else {
        printWrongInput();
    }
}

const decompress = async ([origin, dest]) => {
    if (origin && (!dest || (dest !== '/' && dest !== '\\' && dest !== '.' && dest !== '..'))) {

        const compressedFilePath = getFullPath(origin);
        let decompressPath = '';
        let decompressFileName = '';

        if (dest) {
            decompressPath = path.dirname(dest);
            if (decompressPath === '.') {
                decompressPath = path.dirname(compressedFilePath);
            }
            decompressFileName = path.basename(dest);
        } else {
            decompressPath = path.dirname(compressedFilePath);
            decompressFileName = path.basename(compressedFilePath, path.extname(compressedFilePath));
        }

        if (await checkPath(compressedFilePath) && await checkPath(decompressPath)) {
            await new Promise((resolve, reject) => {
                const readStream = createReadStream(compressedFilePath);
                const writeStream = createWriteStream(path.join(decompressPath, decompressFileName), { flags: 'w' });
                const brotliDecompress = zlib.createBrotliDecompress();
                readStream.pipe(brotliDecompress).pipe(writeStream);

                writeStream.on('finish', () => {
                    process.stdout.write(`File decompressed successfully!\n`);
                    resolve();
                });

                writeStream.on('error', (err) => {
                    reject('Decompression error on WriteStream');
                });

                brotliDecompress.on('error', (err) => {
                    reject('Decompression error on BrotliDecompress');
                });
            }).catch((err) => {
                printWrongInput(err);
            });
        } else {
            printWrongInput('Wrong origin or destination path');
        }
    } else {
        printWrongInput();
    }
}

const osInfo = async ([param]) => {
    if (param === '--EOL') {
        process.stdout.write(`EOL: ${JSON.stringify(os.EOL)}\n`);
    } else if (param === '--cpus') {
        process.stdout.write(`CPUs: ${os.cpus().length}\n`);
    } else if (param === '--homedir') {
        process.stdout.write(`Home Dir: ${os.homedir()}\n`);
    } else if (param === '--username') {
        process.stdout.write(`Username: ${os.userInfo().username}\n`);
    } else if (param === '--architecture') {
        process.stdout.write(`Architecture: ${os.arch()}\n`);
    } else {
        printWrongInput();
    }
}

const exit = () => {
    process.stdout.write(`Thank you for using File Manager${username ? `, ${username}` : ''}, goodbye!\n`);
    process.exit(0);
}

const getFullPath = (pathname) => {
    if (!path.isAbsolute(pathname)) {
        pathname = path.join(curPath, pathname);
    }
    return pathname
}

const printCurPath = () => {
    process.stdout.write(`You are currently in: ${curPath}\n`);
}

const printPrompt = () => {
    printCurPath();
    process.stdout.write(`Waiting for the next command:\n`);
}

const printWrongInput = (text = 'Invalid input') => {
    process.stdout.write(`${text}\n`);
}

const checkPath = async (pathname) => {
    try {
        await fs.access(pathname, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

const getRootDir = (value) => {
    rootDirectory = path.parse(value).root ?? ''
    return rootDirectory;
}

const onData = async (data) => {
    const [cmd, ...params] = data.toString().trim().split(' ');

    if (cmd === 'exit') exit();
    else if (cmd === 'up') await up(); // +
    else if (cmd === 'cd') await cd(params); // +
    else if (cmd === 'ls') await ls(); // +
    else if (cmd === 'os') await osInfo(params); // +
    else if (cmd === 'hash') await hash(params); // +
    else if (cmd === 'compress') await compress(params);
    else if (cmd === 'decompress') await decompress(params);
    else if (cmd === 'cp') await copy(params);
    else if (cmd === 'rm') await remove(params);
    else if (cmd === 'mv') await move(params);
    else if (cmd === 'rn') await rename(params);
    else if (cmd === 'create') await create(params);
    else if (cmd === 'read') await read(params);
    else printWrongInput();

    printPrompt();
}

const slower = () => {
    let result = 0;
    for (let i = 0; i < 1000000000; i++) {
        result += Math.sqrt(i);
    }
}

const main = async () => {
    const param = process.argv[2]?.trim() ?? '';
    if (param.indexOf('--username=') === 0) {
        username = param.split('=')?.[1] || '';
    }

    curPath = os.homedir();
    getRootDir(curPath);
    process.stdout.write(`Welcome to the File Manager${username ? `, ${username}` : ''}!\n`);
    printPrompt();
    process.stdin.on('data', onData);
    process.on('SIGINT', exit);
}

main();
