'use client';

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from '@/components/ui/flow-button';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <AnimatePresence mode="wait">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="mb-8 flex items-center justify-center gap-4 md:mb-12 md:gap-6">
            <motion.span
              className="font-signika select-none text-[80px] font-bold text-[#222222] opacity-70 md:text-[120px]"
              variants={numberVariants}
              custom={-1}
            >
              4
            </motion.span>
            <motion.div
              variants={ghostVariants}
              whileHover="hover"
              animate={['visible', 'floating']}
            >
              <img
                src="https://xubohuah.github.io/xubohua.top/Group.png"
                alt="Ghost"
                className="h-[80px] w-[80px] select-none object-contain md:h-[120px] md:w-[120px]"
                draggable="false"
              />
            </motion.div>
            <motion.span
              className="font-signika select-none text-[80px] font-bold text-[#222222] opacity-70 md:text-[120px]"
              variants={numberVariants}
              custom={1}
            >
              4
            </motion.span>
          </div>

          <motion.h1
            className="font-dm-sans mb-4 select-none text-3xl font-bold text-[#222222] opacity-70 md:mb-6 md:text-5xl"
            variants={itemVariants}
          >
            Boo! Page missing!
          </motion.h1>

          <motion.p
            className="font-dm-sans mb-8 select-none text-lg text-[#222222] opacity-50 md:mb-12 md:text-xl"
            variants={itemVariants}
          >
            Whoops! This page must be a ghost - it&apos;s not here!
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link to="/" className="inline-block">
              <FlowButton text="Find shelter" />
            </Link>
          </motion.div>

          <motion.div className="mt-12" variants={itemVariants}>
            <Link
              to="/"
              className="font-dm-sans select-none text-[#222222] opacity-50 transition-opacity hover:opacity-70"
            >
              Back to home
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
