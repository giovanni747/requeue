"use client";

import { useUser, UserButton } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { CheckCircle, Users, Calendar, Target, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: CheckCircle,
    title: "Task Management",
    description: "Organize and track your team's tasks efficiently"
  },
  {
    icon: Users,
    title: "Team Collaboration", 
    description: "Work seamlessly with your team members"
  },
  {
    icon: Calendar,
    title: "Schedule Planning",
    description: "Plan and manage project timelines"
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set and achieve your project objectives"
  }
];

export default function WelcomePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-sm font-bold">R</span>
            </div>
            <span className="text-xl font-bold">Re:queue</span>
          </div>
          <div className="flex items-center space-x-4">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Welcome Section */}
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Welcome back, {user?.firstName || 'there'}! 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 mb-8"
            >
              Ready to streamline your workflow and boost productivity?
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg">
                Start Your First Project
              </Button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <Card className="p-6 bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
                  <feature.icon className="h-8 w-8 text-white mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-8">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                Create New Project
              </Button>
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                Invite Team Members
              </Button>
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                View Analytics
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
