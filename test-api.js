// Quick test script to verify server response
console.log('Testing server endpoints...');

// Test direct server connection
fetch('http://localhost:5000/api/customers')
  .then(res => res.json())
  .then(data => {
    console.log('Direct server response:', data);
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data.length);
  })
  .catch(err => console.error('Direct server error:', err));

// Test via proxy
fetch('/api/customers')
  .then(res => res.json())
  .then(data => {
    console.log('Proxy response:', data);
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data.length);
  })
  .catch(err => console.error('Proxy error:', err));
