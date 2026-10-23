async function globalSetup(): Promise<void> {
  const res = await fetch('http://localhost:4000/api/test/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to reset backend before test run: ${res.status}`);
  }
}

export default globalSetup;
