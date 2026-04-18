fetch('http://localhost:3000/api/auth/url')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
