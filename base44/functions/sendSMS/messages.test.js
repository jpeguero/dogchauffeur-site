import { describe, it, expect } from 'vitest';
import { buildMessage, formatPhone, VALID_EVENTS, PENDING_REGISTRATION_CODES } from './messages.js';

describe('buildMessage', () => {
  describe('ride_received', () => {
    it('includes the pet name and confirmation language', () => {
      const msg = buildMessage('ride_received', { pet_name: 'Max' });
      expect(msg).toContain('Max');
      expect(msg).toContain("We received your ride request");
      expect(msg).toMatch(/^DogChauffeur:/);
    });

    it('appends tracking link when trip_id is provided', () => {
      const msg = buildMessage('ride_received', { pet_name: 'Max', trip_id: 'trip123' });
      expect(msg).toContain('Track:');
      expect(msg).toContain('trip123');
    });

    it('omits tracking link when trip_id is absent', () => {
      const msg = buildMessage('ride_received', { pet_name: 'Max' });
      expect(msg).not.toContain('Track:');
    });
  });

  describe('ride_confirmed', () => {
    it('includes pet name and driver name', () => {
      const msg = buildMessage('ride_confirmed', { pet_name: 'Bella', driver_name: 'John' });
      expect(msg).toContain('Bella');
      expect(msg).toContain('John');
      expect(msg).toContain('confirmed');
    });
  });

  describe('en_route', () => {
    it('says driver is on the way', () => {
      const msg = buildMessage('en_route', { pet_name: 'Buddy' });
      expect(msg).toContain('Buddy');
      expect(msg).toContain('on the way');
    });
  });

  describe('pet_picked_up', () => {
    it('confirms pet has been picked up', () => {
      const msg = buildMessage('pet_picked_up', { pet_name: 'Luna' });
      expect(msg).toContain('Luna');
      expect(msg).toContain('picked up');
    });
  });

  describe('pet_delivered', () => {
    it('includes pet name and dropoff address', () => {
      const msg = buildMessage('pet_delivered', {
        pet_name: 'Charlie',
        dropoff_address: '123 Main St, Chicago, IL',
      });
      expect(msg).toContain('Charlie');
      expect(msg).toContain('123 Main St, Chicago, IL');
      expect(msg).toContain('arrived safely');
    });

    it('does not append a tracking link', () => {
      const msg = buildMessage('pet_delivered', {
        pet_name: 'Charlie',
        dropoff_address: '123 Main St',
        trip_id: 'trip123',
      });
      // Delivered messages intentionally omit the tracking link
      expect(msg).not.toContain('Track:');
    });
  });

  it('returns null for an unrecognised event type', () => {
    const msg = buildMessage('unknown_event', { pet_name: 'Max' });
    expect(msg).toBeNull();
  });

  it('all messages start with the DogChauffeur brand prefix', () => {
    for (const event of VALID_EVENTS) {
      const msg = buildMessage(event, {
        pet_name: 'Rex',
        driver_name: 'Sam',
        dropoff_address: '456 Oak Ave',
      });
      expect(msg).toMatch(/^DogChauffeur:/);
    }
  });
});

describe('formatPhone', () => {
  it('adds +1 prefix to a bare 10-digit number', () => {
    expect(formatPhone('7085551234')).toBe('+17085551234');
  });

  it('strips parentheses, spaces, and dashes before formatting', () => {
    expect(formatPhone('(708) 555-1234')).toBe('+17085551234');
  });

  it('strips dots before formatting', () => {
    expect(formatPhone('708.555.1234')).toBe('+17085551234');
  });

  it('adds + prefix to an 11-digit number already starting with 1', () => {
    expect(formatPhone('17085551234')).toBe('+17085551234');
  });

  it('handles a number with mixed formatting characters', () => {
    expect(formatPhone('1-708-555-1234')).toBe('+17085551234');
  });
});

describe('VALID_EVENTS', () => {
  it('contains all five transactional event types', () => {
    expect(VALID_EVENTS).toEqual([
      'ride_received',
      'ride_confirmed',
      'en_route',
      'pet_picked_up',
      'pet_delivered',
    ]);
  });
});

describe('PENDING_REGISTRATION_CODES', () => {
  it('includes the main 10DLC carrier filtering codes', () => {
    expect(PENDING_REGISTRATION_CODES).toContain(30034);
    expect(PENDING_REGISTRATION_CODES).toContain(30007);
    expect(PENDING_REGISTRATION_CODES).toContain(21610);
  });
});
