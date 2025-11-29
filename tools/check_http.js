const http = require('http');
const url = process.argv[2] || 'http://localhost:4000/';
http.get(url, res => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', c=> body += c.toString());
  res.on('end', ()=>{
    console.log('Body length:', body.length);
    console.log('Body snippet:\n', body.slice(0,400));
  });
}).on('error', err=>{
  console.error('ERROR', err.message);
});
