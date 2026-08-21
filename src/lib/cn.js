import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and lets the last conflicting utility win.
 *
 * clsx and tailwind-merge have been dependencies of this project since the
 * start without ever being imported. They earn their place here: the
 * navigation menu takes a className from its caller and has to merge it over
 * its own defaults, and plain string concatenation would leave both `p-2` and
 * `p-6` in the class list with the winner decided by stylesheet order rather
 * than by the caller.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
