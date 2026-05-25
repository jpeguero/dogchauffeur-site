import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';

describe('cn', () => {
  it('joins multiple class name strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves tailwind conflicts in favour of the last value', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar');
  });

  it('handles conditional class objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('handles arrays of class names', () => {
    expect(cn(['px-2', 'py-1'], 'font-bold')).toBe('px-2 py-1 font-bold');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns an empty string for all-falsy inputs', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
