const fs = require('fs');
const path = require('path');
const p = path.join(__dirname,'..','..','database','store.json');
try{
  const s = fs.readFileSync(p,'utf8');
  console.log('length=', s.length);
  const pos = 780;
  console.log('sliceJSON:', JSON.stringify(s.slice(pos-20,pos+60)));
  console.log('raw slice:\n', s.slice(pos-20,pos+60));
}catch(err){
  console.error('ERR', err.message);
}
