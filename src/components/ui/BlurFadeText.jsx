import React from 'react';
import { motion } from 'framer-motion';

export default function BlurFadeText({
  text,
  className = '',
  delay = 0,
  duration = 0.8,
  variant,
  as: Component = 'h2',
}) {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: delay * i },
    }),
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      y: 20,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: duration,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <Component className={`inline-block ${className}`}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="inline-flex flex-wrap gap-x-[0.25em]"
      >
        {words.map((word, idx) => {
          // A <br> token has to break the row, and a real <br /> cannot do it
          // here: as a child of a flex container it is blockified into a
          // zero-size flex item and no line break happens. What flex-wrap
          // does respond to is an item that fills the row, so the break is a
          // full-basis spacer of no height. It is not a staggered child
          // either, since there is nothing in it to fade in.
          if (word === '<br>' || word === '<br/>') {
            return <span key={idx} aria-hidden="true" className="basis-full h-0" />;
          }

          return (
            <motion.span key={idx} variants={childVariants} className="inline-block">
              {word}
            </motion.span>
          );
        })}
      </motion.span>
    </Component>
  );
}
