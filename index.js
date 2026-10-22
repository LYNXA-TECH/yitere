const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'ok' }));
  }
  res.writeHead(200);
  res.end(JSON.stringify({
    service: 'yitere',
    description: 'Observatoire des conditions reseau du developpement africain',
    status: 'en construction'
  }));
});

server.listen(port, () => {
  console.log('yitere ecoute sur le port ' + port);
});
