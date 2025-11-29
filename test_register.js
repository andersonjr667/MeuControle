(async ()=>{
  try{
    const res = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Teste', email: 'teste@example.com', password: 'abc12345' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('HEADERS', JSON.stringify(Object.fromEntries(res.headers))); // may not serialize
    console.log('BODY', text);
  }catch(err){
    console.error('REQUEST ERROR', err);
  }
})();
