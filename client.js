const net = require('node:net');
const fs = require('node:fs/promises');
const path = require('node:path');

const clearLine = (dir) => {
  return new Promise((resolve, reject) => {
    process.stdout.clearLine(dir, () => {
      resolve();
    });
  });
};

const moveCursor = (dx, dy) => {
  return new Promise((resolve, reject) => {
    process.stdout.moveCursor(dx, dy, () => {
      resolve();
    });
  });
};

const client = net.createConnection({ port: 3001, host: '127.0.0.1' }, async () => {
  console.log(`Connection created`);

  const filePath = process.argv[2];
  const fileName = path.basename(filePath);
  const header = `---${fileName}---`;

  const fileHandle = await fs.open(filePath, 'r');
  const fileReadStream = fileHandle.createReadStream();
  const fileSize = (await fileHandle.stat()).size;

  client.write(header);

  let uploadedPercetage = 0;

  console.log();
  fileReadStream.on('data', async (data) => {
    if (!client.write(data)) {
      fileReadStream.pause();
    }

    const newPercentage = Math.floor((fileReadStream.bytesRead / fileSize) * 100);

    if (newPercentage % 1 === 0 && newPercentage !== uploadedPercetage) {
      uploadedPercetage = newPercentage;
      await moveCursor(0, -1);
      await clearLine(0);
      console.log(`Uploading... ${uploadedPercetage}%`);
    }
  });

  client.on('drain', () => {
    fileReadStream.resume();
  });

  fileReadStream.on('end', async () => {
    await moveCursor(0, -1);
    await clearLine(0);
    console.log(`Uploaded... 100%`);
  });

  client.on('end', () => {
    console.log('Client connection ended');
    fileHandle?.close();
  });
});
