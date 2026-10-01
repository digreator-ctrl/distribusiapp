async function testFetch() {
  try {
    const res = await fetch('http://localhost:8787/api/products');
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const data = await res.json();
    console.log("Data length:", data.length);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testFetch();
