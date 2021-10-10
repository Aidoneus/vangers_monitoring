var net = require('net');
var Iconv  = require('iconv').Iconv;
var iconv = require('iconv-lite');

function hex2buffer(string, inverse) {
    let bytes = string.match(/.{1,2}/g);
    return Buffer.from(bytes.map(byte => parseInt(byte, 16)));
}

function longHex(int) {
    arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint32(0, int, true);
    return [...new Uint8Array(arr)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
}

function shortHex(int) {
    arr = new ArrayBuffer(2); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint16(0, int, true);
    return [...new Uint8Array(arr)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
}

function stringToAsciiz(string) {
    let iconv = new Iconv('UTF-8', 'CP866');
    string = [...iconv.convert(string)];
    string.push(0);
    return string.map(x => x.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

let sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms);
    })
}

var client = new net.Socket();
client.connect(2197, '127.0.0.1', function() {
	console.log('Connected');
	client.write('Vivat Sicher, Rock\'n\'Roll forever!!!\x00\x01');
});

var send_event = (code, data) => {
    let event = code + data;
    client.write(hex2buffer(shortHex(event.length / 2) + event));
}

client.on('data', async function(data) {
    console.log(data);
    console.log(data.toString());
    if (data.toString() === 'Enter, my son, please...\x00\x01') {
        if (process.argv[2]) {
            send_event('83', longHex(parseInt(process.argv[2]))); //attach game
            await sleep(1000);
            const name = 'vangersbot 2';
            send_event('88', stringToAsciiz(name) + '00'); //set name
            await sleep(1000);
            const message = 'привет мир';
            send_event('95', 'FFFFFFFF' + stringToAsciiz(message));//send message
        } else {
            send_event('81', '');
        }
    }
    if (data[2] && data[2].toString(16) === 'ce') {
        let bot_command = data.slice(4, data.length - 1);
        let iconv = new Iconv('CP866', 'UTF-8');
        bot_command = iconv.convert(bot_command).toString('utf-8');
        console.log(bot_command);
        if (bot_command === 'bot') {
            send_event('95', 'FFFFFFFF' + stringToAsciiz('hi'));
        }
        if (bot_command === 'bot exit') {
            send_event('86', '');
        }
        if (bot_command === 'bot start') {
            send_event('95', 'FFFFFFFF' + stringToAsciiz('5'));
            await sleep(1000);
            send_event('95', 'FFFFFFFF' + stringToAsciiz('4'));
            await sleep(1000);
            send_event('95', 'FFFFFFFF' + stringToAsciiz('3'));
            await sleep(1000);
            send_event('95', 'FFFFFFFF' + stringToAsciiz('2'));
            await sleep(1000);
            send_event('95', 'FFFFFFFF' + stringToAsciiz('1'));
            await sleep(1000);
            send_event('95', 'FFFFFFFF' + stringToAsciiz('ПОЕХАЛИ'));
        }
    }
    if (data[2] && data[2].toString(16) === 'c1') {
        let games_count = data[3];
        console.log('games count:' + games_count);
        data = [...data];
        data = data.slice(4);
        while (data.length > 0) {
            const game_id = new DataView(new Uint8Array(data.slice(0,4)).buffer).getInt32(0, true);
            data = data.slice(4);
            console.log('game id: ' + game_id);
            let i = 0;
            do {
                i++;
            } while (data[i] !== 0);
            const game_name = data.slice(0,i);
            console.log('game_name:' + iconv.decode (new Uint8Array(game_name), 'cp866'));
            data = data.slice(i+1);
            send_event('86', '');
        }
    }
});

client.on('close', function() {
    // client.write(hex2buffer('010086'));
	console.log('Connection closed');
});