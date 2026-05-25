import { describe, it, expect } from 'vitest';
import {
  calculatePrice,
  serviceAreaCheck,
  BASE_FEE,
  MINIMUM_FARE,
  HEAVY_SURCHARGE,
  PER_MILE_AFTER,
  SERVICE_RADIUS_MILES,
} from './pricing.js';

const metersPerMile = 1609.344;

describe('calculatePrice', () => {
  it('charges the base fee for a short trip within the included 5 miles', () => {
    const { price } = calculatePrice(3 * metersPerMile);
    expect(price).toBe(BASE_FEE);
  });

  it('applies per-mile charges beyond the first 5 miles', () => {
    // 10 miles = 5 extra miles × $2.50 = $12.50 over base → $37.50
    const { price } = calculatePrice(10 * metersPerMile);
    expect(price).toBe(37.50);
  });

  it('never goes below the minimum fare', () => {
    const { price } = calculatePrice(1 * metersPerMile);
    expect(price).toBe(MINIMUM_FARE);
  });

  it('adds the heavy surcharge for dogs over 75 lbs', () => {
    const { price: light } = calculatePrice(3 * metersPerMile, 74);
    const { price: heavy, heavySurcharge } = calculatePrice(3 * metersPerMile, 76);
    expect(heavySurcharge).toBe(HEAVY_SURCHARGE);
    expect(heavy - light).toBe(HEAVY_SURCHARGE);
  });

  it('does not add surcharge at exactly the 75 lb threshold', () => {
    const { heavySurcharge } = calculatePrice(3 * metersPerMile, 75);
    expect(heavySurcharge).toBe(0);
  });

  it('applies heavy surcharge on top of distance charges', () => {
    // 10 miles ($37.50) + heavy dog ($15) = $52.50
    const { price } = calculatePrice(10 * metersPerMile, 80);
    expect(price).toBe(52.50);
  });

  it('returns mileage rounded to one decimal place', () => {
    const { miles } = calculatePrice(10 * metersPerMile);
    expect(miles).toBe(10.0);
  });

  it('returns extra miles rounded to one decimal place', () => {
    const { extraMiles } = calculatePrice(10 * metersPerMile);
    expect(extraMiles).toBe(5.0);
  });

  it('returns the per-mile charge amount', () => {
    const { perMileCharge } = calculatePrice(10 * metersPerMile);
    expect(perMileCharge).toBe(5 * PER_MILE_AFTER);
  });

  it('handles zero pet weight as no surcharge', () => {
    const { heavySurcharge } = calculatePrice(3 * metersPerMile, 0);
    expect(heavySurcharge).toBe(0);
  });

  it('handles string pet weight', () => {
    const { heavySurcharge } = calculatePrice(3 * metersPerMile, '80');
    expect(heavySurcharge).toBe(HEAVY_SURCHARGE);
  });

  it('handles missing pet weight as no surcharge', () => {
    const { heavySurcharge } = calculatePrice(3 * metersPerMile);
    expect(heavySurcharge).toBe(0);
  });

  it('minimum fare applies even with heavy surcharge on very short trip', () => {
    // 0 miles + heavy dog = $25 base + $15 surcharge = $40 (still above minimum)
    const { price } = calculatePrice(0, 80);
    expect(price).toBe(BASE_FEE + HEAVY_SURCHARGE);
  });
});

describe('serviceAreaCheck', () => {
  it('marks a pickup within 25 miles as in-service', () => {
    const { out_of_service_area, home_to_pickup_miles } = serviceAreaCheck(20 * metersPerMile);
    expect(out_of_service_area).toBe(false);
    expect(home_to_pickup_miles).toBe(20.0);
  });

  it('marks a pickup beyond 25 miles as out-of-service', () => {
    const { out_of_service_area } = serviceAreaCheck(30 * metersPerMile);
    expect(out_of_service_area).toBe(true);
  });

  it('treats exactly the service radius as in-service', () => {
    const { out_of_service_area } = serviceAreaCheck(SERVICE_RADIUS_MILES * metersPerMile);
    expect(out_of_service_area).toBe(false);
  });

  it('rounds distance to one decimal place', () => {
    const { home_to_pickup_miles } = serviceAreaCheck(10.15 * metersPerMile);
    expect(Number.isInteger(home_to_pickup_miles * 10)).toBe(true);
  });
});
