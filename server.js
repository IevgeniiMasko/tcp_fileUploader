const net = require('node:net');
const fs = require('node:fs');
const fsPromise = require('node:fs/promises');

const storagePath = './storage';

const server = net.createServer();

server.on('connection', async (socket) => {
  console.log('New connection');

  let fileHandle, fileWriteStream;

  socket.on('data', async (data) => {
    if (!fileHandle) {
      socket.pause();

      const dataStr = data.toString('utf-8');
      const divider = dataStr.lastIndexOf('---');

      const fileName = dataStr.substring(3, divider);

      fileHandle = await fsPromise.open(`${storagePath}/${fileName}`, 'w');
      fileWriteStream = fileHandle.createWriteStream();

      fileWriteStream.write(data.subarray(divider + 3));

      socket.resume();

      fileWriteStream.on('drain', () => {
        socket.resume();
      });
    } else {
      if (!fileWriteStream.write(data)) {
        socket.pause();
      }
    }
  });

  socket.on('end', () => {
    fileHandle?.close();
  });
});

server.listen(3001, '127.0.0.1', () => {
  console.log(`Server is listening on`, server.address());

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }
});
