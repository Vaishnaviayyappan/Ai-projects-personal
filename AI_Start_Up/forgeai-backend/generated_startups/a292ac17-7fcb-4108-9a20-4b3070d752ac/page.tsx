'use client';
import React, { useState, useEffect } from 'react';
import { AiOutlineHome, AiOutlineDashboard, AiOutlineFeatures, AiOutlinePricing } from 'lucide-react';
import { motion, AnimatePulse } from 'framer-motion';
const App = () => {
  const [view, setView] = useState('Home');
  const handleViewChange = (newView) => {
    setView(newView);
  };
  return (
    <div className="bg-gradient-to-r from-[#2c3e50] to-[#333] h-screen">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="backdrop-blur backdrop-blur-sm absolute top-0 left-0 h-screen w-full"
      >
        <div className="h-screen w-full flex flex-col items-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="animate-pulse w-1/2 h-1/2 bg-white rounded-full shadow-md"
          />
          <div className="h-1/2 flex justify-center items-center">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="animate-pulse w-1/2 h-1/2 bg-white rounded-full shadow-md"
            />
          </div>
          <div className="h-1/2 flex justify-center items-center">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="animate-pulse w-1/2 h-1/2 bg-white rounded-full shadow-md"
            />
          </div>
        </div>
        <div className="h-1/2 flex justify-center items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="animate-pulse w-1/2 h-1/2 bg-white rounded-full shadow-md"
          />
        </div>
        <div className="h-1/2 flex justify-center items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="animate-pulse w-1/2 h-1/2 bg-white rounded-full shadow-md"
          />
        </div>
        <div className="flex flex-col items-center mt-10">
          <h1 className="text-3xl font-bold text-white">AI Tutor for Rural Schools</h1>
          <p className="text-2xl text-white">Empowering Education, One Student at a Time</p>
        </div>
        <div className="flex flex-wrap mt-10">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-1/3 animate-pulse bg-white rounded-md shadow-md hover:scale-105 transition-all"
          >
            <h2 className="text-2xl font-bold text-white">Home</h2>
            <p className="text-xl text-white">Welcome to our AI-powered tutoring platform</p>
            <button
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleViewChange('Dashboard')}
            >
              Get Started
            </button>
          </motion.div>
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-1/3 animate-pulse bg-white rounded-md shadow-md hover:scale-105 transition-all"
          >
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-xl text-white">View your progress and connect with our team</p>
            <button
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleViewChange('Features')}
            >
              View Features
            </button>
          </motion.div>
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-1/3 animate-pulse bg-white rounded-md shadow-md hover:scale-105 transition-all"
          >
            <h2 className="text-2xl font-bold text-white">Features</h2>
            <p className="text-xl text-white">Explore the capabilities of our AI-powered platform</p>
            <button
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => handleViewChange('Pricing')}
            >
              View Pricing
            </button>
          </motion.div>
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-1/3 animate-pulse bg-white rounded-md shadow-md hover:scale-105 transition-all"
          >
            <h2 className="text-2xl font-bold text-white">Pricing</h2>
            <p className="text-xl text-white">Discover how our platform can benefit your school</p>
          </motion.div>
        </div>
        <div className="flex flex-col items-center mt-10">
          <h1 className="text-3xl font-bold text-white">Interactive Pricing Table</h1>
          <table className="w-1/2 h-1/2 bg-white rounded-md shadow-md">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-2 text-left">Plan</th>
                <th className="px-4 py-2 text-left">Monthly Fee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-left">Basic</td>
                <td className="px-4 py-2 text-left">$20/month</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-left">Premium</td>
                <td className="px-4 py-2 text-left">$50/month</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-left">Enterprise</td>
                <td className="px-4 py-2 text-left">$100/month</td>
              </tr>
            </tbody>
          </table>
          <h1 className="text-3xl font-bold text-white mt-10">Dashboard Mockup with Stat Cards and Chart</h1>
          <div className="h-1/2 bg-white rounded-md shadow-md">
            <div className="h-1/2 flex justify-center items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-1/4 h-1/4 rounded-full bg-orange-500 shadow-md"
              />
              <div className="text-2xl font-bold text-white">Students</div>
              <p className="text-xl text-white">1000</p>
            </div>
            <div className="h-1/2 flex justify-center items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-1/4 h-1/4 rounded-full bg-orange-500 shadow-md"
              />
              <div className="text-2xl font-bold text-white">Teachers</div>
              <p className="text-xl text-white">50</p>
            </div>
            <div className="h-1/2 flex justify-center items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-1/4 h-1/4 rounded-full bg-orange-500 shadow-md"
              />
              <div className="text-2xl font-bold text-white">Progress</div>
              <p className="text-xl text-white">90%</p>
            </div>
            <div className="h-1/2 flex justify-center items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-1/4 h-1/4 rounded-full bg-orange-500 shadow-md"
              />
              <div className="text-2xl font-bold text-white">Score</div>
              <p className="text-xl text-white">85%</p>
            </div>
          </div>
          <div className="h-1/2 bg-white rounded-md shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M8 16h8V8H8v8zm0-8h8V8H8v8z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="h-1/2 flex justify-center items-center mt-10">
        <button
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleViewChange('Home')}
        >
          Home
        </button>
        <button
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded ml-4"
          onClick={() => handleViewChange('Dashboard')}
        >
          Dashboard
        </button>
        <button
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded ml-4"
          onClick={() => handleViewChange('Features')}
        >
          Features
        </button>
        <button
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded ml-4"
          onClick={() => handleViewChange('Pricing')}
        >
          Pricing
        </button>
      </div>
    </div>
  );
};
export default App;