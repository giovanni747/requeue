"use client";
import { HeroSection } from "@/components/hero-section";
import { TestimonialsColumn } from "@/components/testimonial";
import { motion } from "motion/react";
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const testimonials = [
  {
    text: "Re:queue transformed our team workflow. Tasks are organized, deadlines are met, and collaboration has never been smoother.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Johnson",
    role: "Project Manager",
  },
  {
    text: "The intuitive interface made adoption effortless. Our productivity increased significantly within the first week of using Re:queue.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Mike Chen",
    role: "Team Lead",
  },
  {
    text: "Re:queue's real-time updates keep everyone on the same page. No more missed deadlines or confusion about task priorities.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Emma Rodriguez",
    role: "Operations Manager",
  },
  {
    text: "Simple yet powerful. Re:queue eliminated the chaos from our project management and brought clarity to our workflow.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Kim",
    role: "CEO",
  },
  {
    text: "The collaborative features are outstanding. Team communication and task tracking became seamless with Re:queue.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Lisa Thompson",
    role: "Product Manager",
  },
  {
    text: "Re:queue's streamlined approach to task management helped us deliver projects faster and with better quality.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Jessica Lee",
    role: "Business Analyst",
  },
  {
    text: "Our team coordination improved dramatically. Re:queue makes complex projects feel manageable and organized.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Alex Wilson",
    role: "Marketing Director",
  },
  {
    text: "The clean design and powerful features make Re:queue the perfect solution for modern team collaboration.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Rachel Green",
    role: "Sales Manager",
  },
  {
    text: "Re:queue eliminated workflow bottlenecks and improved our team's efficiency. Highly recommend for any growing business.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "James Davis",
    role: "Operations Director",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/welcome');
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Don't render content if user is signed in (they'll be redirected)
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return (
    <div>
      <HeroSection />
      <section className="bg-background my-20 relative">
        <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
              See what our customers have to say about us.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>
    </div>
  );
}
