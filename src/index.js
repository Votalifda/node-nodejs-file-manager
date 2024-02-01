const os = require('os');

let username = '';
let curPath = '';

const up = async () => {
    console.log('up');
}

const cd = async (params) => {
    console.log('cd', params);
}

const ls = async () => {
    console.log('ls');
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

const hash = async (params) => {
    console.log('hash', params);
    let result = 0;
    for (let i = 0; i < 1000000000; i++) {
        result += Math.sqrt(i);
    }
}

const compress = async (params) => {
    console.log('compress', params);
}

const decompress = async (params) => {
    console.log('decompress', params);
}

const osInfo = async (params) => {
    console.log('os', params);
}

const exit = () => {
    process.stdout.write(`Thank you for using File Manager${username ? `, ${username}` : ''}, goodbye!\n`);
    process.exit(0);
}

const printCurPath = () => {
    process.stdout.write(`You are currently in: ${curPath}\n`);
}

const printPrompt = () => {
    process.stdout.write(`Waiting for the command:\n`);
}

const onData = (data) => {
    const [cmd, ...params] = data.toString().trim().split(' ');

    if (cmd === 'exit') exit();
    else if (cmd === 'os') osInfo(params);
    else if (cmd === 'hash') hash(params);
    else if (cmd === 'compress') compress(params);
    else if (cmd === 'decompress') decompress(params);
    else if (cmd === 'rm') remove(params);
    else if (cmd === 'mv') move(params);
    else if (cmd === 'cp') copy(params);
    else if (cmd === 'rn') rename(params);
    else if (cmd === 'create') create(params);
    else if (cmd === 'read') read(params);
    else if (cmd === 'up') up();
    else if (cmd === 'cd') cd(params);
    else if (cmd === 'ls') ls();
    else process.stdout.write('Invalid input\n');

    printCurPath();
    printPrompt();
}

const main = async () => {
    const param = process.argv[2]?.trim() ?? '';
    if (param.indexOf('--username=') === 0) {
        username = param.split('=')?.[1] || '';
    }
    curPath = os.homedir();
    process.stdout.write(`Welcome to the File Manager${username ? `, ${username}` : ''}!\n`);
    printCurPath();
    printPrompt();
    process.stdin.on('data', onData);
    process.on('SIGINT', exit);
}

main();
