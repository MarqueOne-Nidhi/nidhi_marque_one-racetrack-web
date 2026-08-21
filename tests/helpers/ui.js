import userEvent from '@testing-library/user-event';

/**
 * user-event types one character at a time with a real delay by default,
 * which turned a form-filling suite into half a minute of waiting. The delay
 * exists to catch debounced handlers; none of these forms has one, so it is
 * turned off here and the tests run in a second.
 */
export const setupUser = () => userEvent.setup({ delay: null });
