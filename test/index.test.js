const test = require('node:test');
const assert = require('node:assert/strict');
const pr = require('../index.js');

test('isPrime - classic path (small numbers)', () => {
    assert.equal(pr.isPrime(2), true);
    assert.equal(pr.isPrime(13), true);
    assert.equal(pr.isPrime(28), false);
    assert.equal(pr.isPrime(1), false);
    assert.equal(pr.isPrime(0), false);
    assert.equal(pr.isPrime(-7), false);
});

test('isPrime - Miller-Rabin path (7+ digit Number, BigInt, and numeric string)', () => {
    assert.equal(pr.isPrime(1000003), true);
    assert.equal(pr.isPrime(1000005), false);
    assert.equal(pr.isPrime(1000003n), true);
    assert.equal(pr.isPrime('1000003'), true);
    // 2^61 - 1, a known Mersenne prime, exceeds Number.MAX_SAFE_INTEGER precision territory
    assert.equal(pr.isPrime('2305843009213693951'), true);
    assert.equal(pr.isPrime(9007199254740881n), true);
    assert.equal(pr.isPrime(9007199254740881n + 2n), false);
});

test('isPrime - very large BigInt beyond deterministic base range (random-base Miller-Rabin)', () => {
    const m127 = (2n ** 127n) - 1n; // known Mersenne prime
    assert.equal(pr.isPrime(m127, 7, 25, true), true);
    assert.equal(pr.isPrime(m127 - 2n, 7, 25, true), false);
});

test('nthPrime / indexOfPrime', () => {
    assert.equal(pr.nthPrime(5), 11);
    assert.equal(pr.nthPrime(1), 2);
    assert.equal(pr.nthPrime(0), false);
    assert.equal(pr.nthPrime(-3), false);
    assert.equal(pr.indexOfPrime(13), 5);
    assert.equal(pr.indexOfPrime(4), false);
});

test('nextPrime / prevPrime', () => {
    assert.equal(pr.nextPrime(17), 19);
    assert.equal(pr.prevPrime(17), 13);
    assert.equal(pr.prevPrime(2), false);
    assert.equal(pr.nextPrime(4), false);
});

test('primeSmallerThan / primeBiggerThan do not hang on prime or tiny input', () => {
    assert.equal(pr.primeSmallerThan(100), 97);
    assert.equal(pr.primeBiggerThan(100), 101);
    assert.equal(pr.primeSmallerThan(23), 19); // 23 itself is prime
    assert.equal(pr.primeBiggerThan(23), 29);
    assert.equal(pr.primeSmallerThan(1), false);
    assert.equal(pr.primeBiggerThan(1), 2);
});

test('primesSmallerThan does not hang when val is prime or tiny', () => {
    assert.deepEqual(pr.primesSmallerThan(25), [2, 3, 5, 7, 11, 13, 17, 19, 23]);
    assert.deepEqual(pr.primesSmallerThan(23), [2, 3, 5, 7, 11, 13, 17, 19]);
    assert.deepEqual(pr.primesSmallerThan(2), []);
});

test('primeDivisors / primeDivisorsSum / primeDivisorsTimes', () => {
    assert.deepEqual(pr.primeDivisors(42), [2, 3, 7]);
    assert.deepEqual(pr.primeDivisors(12), [2, 3]);
    assert.equal(pr.primeDivisorsSum(42), 12);
    assert.equal(pr.primeDivisorsTimes(42), 42);
    assert.equal(pr.primeDivisors(13), false);
});

test('isMersennePrime / nthMersennePrime / nthMersennePrimeExponents', () => {
    assert.equal(pr.isMersennePrime(127), true);
    assert.equal(pr.isMersennePrime(13), false);
    assert.equal(pr.nthMersennePrime(5), 8191);
    assert.equal(pr.nthMersennePrime(0), false);
    assert.equal(pr.nthMersennePrimeExponents(5), 13);
    assert.equal(pr.nthMersennePrimeExponents(0), false);
});

test('primesBetween excludes numbers outside the open interval', () => {
    assert.deepEqual(pr.primesBetween(8, 10), []);
    assert.deepEqual(pr.primesBetween(80, 150),
        [83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149]);
});

test('firstNPrimes / closestPrime / randomPrime', () => {
    assert.deepEqual(pr.firstNPrimes(7), [2, 3, 5, 7, 11, 13, 17]);
    assert.equal(pr.closestPrime(25), 23);
    const rp = pr.randomPrime(25, 48);
    assert.ok(pr.isPrime(rp) && rp >= 25 && rp <= 48);
    assert.equal(typeof pr.randomPrime(), 'number');
});

test('randomPrimeDigits returns a prime with exactly the requested digit count', () => {
    for (let i = 0; i < 20; i++) {
        const v = pr.randomPrimeDigits(3);
        assert.equal(String(v).length, 3);
        assert.equal(pr.isPrime(v), true);
    }
});

test('isPandigitalPrime checks digits 1..n used exactly once', () => {
    assert.equal(pr.isPandigitalPrime(2143), true);
    assert.equal(pr.isPandigitalPrime(1223), false); // repeated digit
    assert.equal(pr.isPandigitalPrime(89), false);   // prime but not pandigital
});

test('isEmirp excludes palindromic primes', () => {
    assert.equal(pr.isEmirp(13), true);
    assert.equal(pr.isEmirp(31), true);
    assert.equal(pr.isEmirp(19), false);
    assert.equal(pr.isEmirp(2), false);
    assert.equal(pr.isEmirp(11), false);
    assert.equal(pr.isEmirp(101), false);
});

test('nthEmirp starts at the first true emirp', () => {
    assert.equal(pr.nthEmirp(1), 13);
    assert.equal(pr.nthEmirp(2), 17);
});

test('hasTwinPrime', () => {
    assert.equal(pr.hasTwinPrime(3), 5);
    assert.deepEqual(pr.hasTwinPrime(5), [3, 7]);
    assert.equal(pr.hasTwinPrime(3, false), true);
    assert.equal(pr.hasTwinPrime(37), false);
});

test('factorial', () => {
    assert.equal(pr.factorial(3), 6);
    assert.equal(pr.factorial(pr.factorial(3)), 720);
});

test('wilsonsTheorem stays correct beyond factorial(20) precision limits', () => {
    assert.equal(pr.wilsonsTheorem(6, false), 7);
    assert.equal(pr.wilsonsTheorem(24, false), false);
    assert.equal(pr.wilsonsTheorem(28, false), 29);
    assert.equal(pr.wilsonsTheorem(40, false), 41);
});

test('phi / totient', () => {
    assert.equal(pr.phi(1), 1);
    assert.equal(pr.phi(10), 4);
    assert.equal(pr.phi(36), 12);
    assert.equal(pr.totient(5), 4);
});

test('digits ignores sign and decimal point', () => {
    assert.equal(pr.digits(1554), 4);
    assert.equal(pr.digits(-500), 3);
    assert.equal(pr.digits(3.14), 1);
});

test('integerToArray / firstNDigits / lastNDigits / reverseNumber handle negatives', () => {
    assert.deepEqual(pr.integerToArray(1234567890), [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    assert.deepEqual(pr.integerToArray(-1234), [1, 2, 3, 4]);
    assert.equal(pr.firstNDigits(1234567890, 4), 1234);
    assert.equal(pr.firstNDigits(-1234, 2), 12);
    assert.equal(pr.lastNDigits(1234567890, 4), 7890);
    assert.equal(pr.reverseNumber(123456), 654321);
});

test('integerToText falls back to English for an unknown language', () => {
    assert.equal(pr.integerToText(1234567890), 'bcdefghija');
    assert.equal(pr.integerToText(123, 'de'), 'bcd');
});

test('beautifyInteger', () => {
    assert.equal(pr.beautifyInteger(123123123), '123.123.123');
});

test('isTruncatable / truncatableValues / nthTruncatablePrime', () => {
    assert.equal(pr.isTruncatable(3797), true);
    assert.equal(pr.isTruncatable(373), true);
    assert.equal(pr.isTruncatable(11), false);
    assert.equal(pr.nthTruncatablePrime(10), 3797);
});

test('isPrimeOld matches isPrime on small inputs (boundary cases)', () => {
    assert.equal(pr.isPrimeOld(1), false);
    assert.equal(pr.isPrimeOld(0), false);
    assert.equal(pr.isPrimeOld(-7), false);
    assert.equal(pr.isPrimeOld(13), true);
});

test('no implicit globals leak from loops', () => {
    pr.firstNPrimes(3);
    pr.isPrimeOld(5);
    assert.equal(typeof global.i, 'undefined');
    assert.equal(typeof global.res, 'undefined');
});
