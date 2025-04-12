export const transition = { type: "spring", duration: 0.8 }; // Transition object for animations

export const slideAnimation = (direction) => {
  // Function for creating slide animations
  return {
    initial: {
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0, // x position based on direction
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0, // y position based on direction
      opacity: 0,
      transition: { ...transition, delay: 0.5 }, // Transition object with delay
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { ...transition, delay: 0 }, // Transition object with no delay
    },
    exit: {
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0, // x position based on direction
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0, // y position based on direction
      transition: { ...transition, delay: 0 }, // Transition object with no delay
    },
  };
};

export const fadeAnimation = {
  // Function for creating fade animations
  initial: {
    opacity: 0,
    transition: { ...transition, delay: 0.5 }, // Transition object with delay
  },
  animate: {
    opacity: 1,
    transition: { ...transition, delay: 0 }, // Transition object with no delay
  },
  exit: {
    opacity: 0,
    transition: { ...transition, delay: 0 }, // Transition object with no delay
  },
};

export const headTextAnimation = {
  // Animation for head text
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: {
    type: "spring",
    damping: 5,
    stiffness: 40,
    restDelta: 0.001,
    duration: 0.3,
  },
};

export const headContentAnimation = {
  // Animation for head content
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: {
    type: "spring",
    damping: 7,
    stiffness: 30,
    restDelta: 0.001,
    duration: 0.6,
    delay: 0.2,
    delayChildren: 0.2,
  },
};

export const headContainerAnimation = {
  // Animation for head container
  initial: { x: -100, opacity: 0, transition: { ...transition, delay: 0.5 } },
  animate: { x: 0, opacity: 1, transition: { ...transition, delay: 0 } },
  exit: { x: -100, opacity: 0, transition: { ...transition, delay: 0 } },
};
