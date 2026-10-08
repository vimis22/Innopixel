// Simple shape check; the server must still verify addresses.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Digits, spaces, +, - and parentheses; 6-20 characters
export const PHONE_PATTERN = /^[+\d][\d\s()-]{5,19}$/;
