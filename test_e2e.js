async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@st.kobedenshi.ac.jp', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    
    const token = loginData.access_token;
    
    const followRes = await fetch('http://localhost:5000/follows/e92f0077-f6b2-431e-8fbd-ade1c767abf4', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Follow status:', followRes.status);
    const followText = await followRes.text();
    console.log('Follow body:', followText);
  } catch(e) {
    console.error(e);
  }
}
test();
