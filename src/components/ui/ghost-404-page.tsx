'use client';

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from '@/components/ui/flow-button';
import notFoundImg from '@/assets/images/image.png';

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96],
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const numberVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5,
  }),
  visible: {
    opacity: 0.7,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const ghostVariants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 15,
    rotate: -5,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      rotate: {
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  },
  floating: {
    y: [-5, 5],
    transition: {
      y: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  },
};

export function NotFoundGhost() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            variants={ghostVariants}
            animate={['visible', 'floating']}
            className="relative"
          >
            <img
              src={notFoundImg}
              alt="404"
              className="h-screen w-auto select-none object-contain"
              draggable="false"
            />
            <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-white/50 px-14 py-6 backdrop-blur-lg">
              <p className="text-2xl font-medium text-rose-400 md:text-3xl">404 Not Found</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
