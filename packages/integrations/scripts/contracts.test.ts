import assert from "node:assert/strict";
import test from "node:test";
import { createOrderNumber, normalizeIndonesianPhone, toIntegerRupiah } from "../src/index.ts";

test("IDR uses integer rupiah without a 100x conversion", () => {
  assert.equal(toIntegerRupiah(270000), 270000);
  assert.equal(toIntegerRupiah(18000.4), 18000);
  assert.throws(() => toIntegerRupiah(-1), /non-negative/);
});

test("order numbers remain distinct within the same millisecond", () => {
  const timestamp = 1_723_776_000_000;
  const first = createOrderNumber(timestamp, "11111111-1111-4111-8111-111111111111");
  const second = createOrderNumber(timestamp, "22222222-2222-4222-8222-222222222222");
  assert.notEqual(first, second);
  assert.match(first, /^ORD_[A-Z0-9]+_[A-F0-9]{8}$/);
});

test("Indonesian phone numbers normalize to country-code digits", () => {
  assert.equal(normalizeIndonesianPhone("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeIndonesianPhone("+62 812 3456 7890"), "6281234567890");
});
