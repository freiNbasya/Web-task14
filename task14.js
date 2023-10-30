const http = require('http');
const fs = require('fs');
const os = require('os');
const url = require('url');

let userList = require('./users.json');

function readFileSync(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }
  
  function readFileAsync(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) throw err;
      callback(data);
    });
  }

function getSystemInfo() {

    const osInfo = {
      osType: os.type(),
      osPlatform: os.platform(),
      osArch: os.arch(),
      osRelease: os.release(),
      cpuModel: getCpuModel(),
      cpuCores: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      userInfo: {
        username: os.userInfo().username,
        homedir: os.userInfo().homedir,
      },
    };
  
    return osInfo;
  }
  
  function getCpuModel() {
    const cpuInfo = os.cpus()[0];
    return cpuInfo ? cpuInfo.model : 'N/A';
  }
  
  function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
  
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
  
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url.startsWith('/getSync')) {
      try {
        const fileContent = readFileSync('bigfile.txt');
        res.end(fileContent);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else if (req.url.startsWith('/getAsync')) {
      readFileAsync('bigfile.txt', (fileContent) => {
        res.end(fileContent);
      });
    } else if (req.url.startsWith('/getUserList')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(userList));
    } else if (req.url.startsWith('/getUserByID')) {
      const userId = parseInt(req.url.split('/').pop());
      const user = userList.find((u) => u.id === userId);
      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('User not found');
      }
    } else if (req.url.startsWith('/systemInfo')) {
      try {
        const systemInfo = getSystemInfo();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(systemInfo));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } else if (req.method === 'POST') {
    if (req.url.startsWith('/createUser')) {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        try {
          const newUser = {
            id: userList.length + 1,
            firstName: query.firstName,
            lastName: query.lastName,
            status: query.status,
            friends: [],
          };
  
          userList.push(newUser);
          saveUsersFile('./users.json', userList); 
  
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newUser));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(`Bad Request ${error}`);
        }
    }
  } else if (req.method === 'PUT') {
    if (req.url.startsWith('/updateUser')) {
      const userId = parseInt(req.url.split('/').pop());
      const userIndex = userList.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const updatedUser = JSON.parse(body);
            userList[userIndex] = { ...userList[userIndex], ...updatedUser };
            saveUsersFile('./users.json', userList); 
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(userList));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request');
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('User not found');
      }
    }
  } else if (req.method === 'DELETE') {
    if (req.url.startsWith('/deleteUser')) {
      const userId = parseInt(req.url.split('/').pop());
      const userIndex = userList.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        userList.splice(userIndex, 1);
        saveUsersFile('./users.json', userList); 
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userList));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('User not found');
      }
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function saveUsersFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});