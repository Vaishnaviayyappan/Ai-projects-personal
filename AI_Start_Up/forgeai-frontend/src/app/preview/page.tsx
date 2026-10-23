'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
function Home() {
  const [voiceInput, setVoiceInput] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const handleSpeak = async (e: FormEvent) => {
    e.preventDefault();
    // Your API call to process voice input
    const response = await fetch('/api/voice-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: voiceInput }),
    });
    const data = await response.json();
    setTranscribedText(data.transcript);
  };
  return (
    <div className="bg-gray-100 h-screen">
      <header
        className="bg-blue-500 p-4 text-white relative"
        style={{ zIndex: 1 }}
      >
        <h1 className="text-3xl">Voice First AI</h1>
      </header>
      <form onSubmit={handleSpeak} className="p-4">
        <input
          type="text"
          value={voiceInput}
          onChange={(e) => setVoiceInput(e.target.value)}
          placeholder="Speak into your phone"
          className="w-full p-2 border-b-2 border-gray-400"
        />
      </form>
      <p className="mt-4 text-lg">{transcribedText}</p>
      <Link href="/phone-call" passHref>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Make a phone call
        </button>
      </Link>
    </div>
  );
}
export default Home;