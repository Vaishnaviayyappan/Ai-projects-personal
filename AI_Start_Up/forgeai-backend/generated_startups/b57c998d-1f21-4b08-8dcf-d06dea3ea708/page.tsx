export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 mb-6 text-center">
        AI chatbot
      </h1>
      <p className="text-2xl text-gray-400 mb-12 text-center max-w-2xl">
        This is your generated MVP. Ready to conquer the market.
      </p>
      <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-purple-500/30">
        Join the Waitlist
      </button>
    </div>
  );
}