(async ()=>{
  try{
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testjson@example.com', password: 'abc12345' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  }catch(err){
    console.error('REQUEST ERROR', err);
  }
})();
