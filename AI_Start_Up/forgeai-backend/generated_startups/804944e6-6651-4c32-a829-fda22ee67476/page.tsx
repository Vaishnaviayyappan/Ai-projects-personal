'use client';
import React, { useState, useEffect } from 'react';
import { View, Flex, Text, Link, Image, Button } from '@chakra-ui/react';
import { AiOutlineHome, AiOutlineCalendar, AiOutlineChartBar, AiOutlinePeopleGroup } from 'lucide-react';
import 'tailwindcss.tailwindcss';
function App() {
  const [view, setView] = useState('home');
  const handleView = (view) => {
    setView(view);
  };
  return (
    <View w="100%" h="100%" bgGradient="linear(to-r, #333, #444)" p={4}>
      {view === 'home' && (
        <Flex w="100%" h="100%" justify="center" align="center">
          <Text fontSize={48} fontWeight="bold" color="#fff" animatePulse>
            MealGenie
          </Text>
          <Text fontSize={24} color="#fff" animatePulse>
            Your personal AI meal planner for students
          </Text>
          <Link to="#" href="#" onClick={() => handleView('dashboard')}>
            <Flex justify="center" align="center" bgGradient="linear(to-r, #333, #444)" p={2} rounded="md">
              <AiOutlineCalendar size={24} color="#fff" />
              <Text fontSize={16} color="#fff">Dashboard</Text>
            </Flex>
          </Link>
          <Link to="#" href="#" onClick={() => handleView('features')}>
            <Flex justify="center" align="center" bgGradient="linear(to-r, #333, #444)" p={2} rounded="md">
              <AiOutlineHome size={24} color="#fff" />
              <Text fontSize={16} color="#fff">Features</Text>
            </Flex>
          </Link>
          <Link to="#" href="#" onClick={() => handleView('pricing')}>
            <Flex justify="center" align="center" bgGradient="linear(to-r, #333, #444)" p={2} rounded="md">
              <AiOutlineChartBar size={24} color="#fff" />
              <Text fontSize={16} color="#fff">Pricing</Text>
            </Flex>
          </Link>
        </Flex>
      )}
      {view === 'dashboard' && (
        <View w="100%" h="100%" bgGradient="linear(to-r, #333, #444)" p={4}>
          <Flex justify="center" align="center" w="100%" h="100%">
            <Image src="/dashboard.jpg" alt="Dashboard" w="50%" h="50%" rounded="md" />
            <Flex justify="space-between" align="center" w="50%" h="50%" animatePulse>
              <Text fontSize={24} fontWeight="bold" color="#fff" w="50%">
                MealGenie
              </Text>
              <Text fontSize={16} color="#fff" w="50%">
                Your personal AI meal planner for students
              </Text>
            </Flex>
            <Flex justify="space-between" align="center" w="50%" h="50%" animatePulse>
              <Text fontSize={24} fontWeight="bold" color="#fff" w="50%">
                Meal History
              </Text>
              <Text fontSize={16} color="#fff" w="50%">
                Track your meals and stay on top of your nutrition
              </Text>
            </Flex>
          </Flex>
        </View>
      )}
      {view === 'features' && (
        <View w="100%" h="100%" bgGradient="linear(to-r, #333, #444)" p={4}>
          <Flex justify="center" align="center" w="100%" h="100%" animatePulse>
            <View w="50%" h="50%" bgGradient="linear(to-r, #333, #444)" rounded="md" p={4} hoverScale={105} transitionAll>
              <Text fontSize={24} fontWeight="bold" color="#fff" w="100%">
                Meal Planning
              </Text>
              <Text fontSize={16} color="#fff" w="100%">
                Plan your meals in advance with our easy-to-use interface
              </Text>
            </View>
            <View w="50%" h="50%" bgGradient="linear(to-r, #333, #444)" rounded="md" p={4} hoverScale={105} transitionAll>
              <Text fontSize={24} fontWeight="bold" color="#fff" w="100%">
                Meal Tracking
              </Text>
              <Text fontSize={16} color="#fff" w="100%">
                Track your meals and stay on top of your nutrition
              </Text>
            </View>
          </Flex>
          <Flex justify="space-between" align="center" w="100%" h="50%" animatePulse>
            <Text fontSize={24} fontWeight="bold" color="#fff" w="50%">
              Features
            </Text>
            <Text fontSize={16} color="#fff" w="50%">
              Discover how MealGenie can help you achieve your health goals
            </Text>
          </Flex>
        </View>
      )}
      {view === 'pricing' && (
        <View w="100%" h="100%" bgGradient="linear(to-r, #333, #444)" p={4}>
          <Flex justify="center" align="center" w="100%" h="100%" animatePulse>
            <Text fontSize={24} fontWeight="bold" color="#fff" w="100%">
              Pricing
            </Text>
            <Text fontSize={16} color="#fff" w="100%">
              Find a plan that fits your budget and needs
            </Text>
          </Flex>
          <Flex justify="space-between" align="center" w="100%" h="50%" animatePulse>
            <Text fontSize={24} fontWeight="bold" color="#fff" w="50%">
              Individual
            </Text>
            <Text fontSize={16} color="#fff" w="50%">
              $9.99/month
            </Text>
          </Flex>
          <Flex justify="space-between" align="center" w="100%" h="50%" animatePulse>
            <Text fontSize={24} fontWeight="bold" color="#fff" w="50%">
              Family
            </Text>
            <Text fontSize={16} color="#fff" w="50%">
              $14.99/month
            </Text>
          </Flex>
        </View>
      )}
    </View>
  );
}
export default App;