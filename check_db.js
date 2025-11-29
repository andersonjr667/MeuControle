(async ()=>{
  try{
    const db = require('./config/db');
    const data = await db.load();
    console.log('Store keys:', Object.keys(data));
    console.log('Users count:', (data.users || []).length);
    console.log('Transactions count:', (data.transactions || []).length);
  }catch(err){
    console.error('DB Connection Error', err && (err.code || err.message) );
  }
})();
