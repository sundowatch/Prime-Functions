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

test('isPrime - classic path on a literal BigInt composite (0 vs 0n regression)', () => {
    // classicPrimeTest used to compare a BigInt modulo result against the
    // Number literal 0 instead of 0n, so every divisibility check silently
    // failed for BigInt input under the classic-test digit threshold.
    assert.equal(pr.isPrime(9n), false);
    assert.equal(pr.isPrime(21n), false);
    assert.equal(pr.isPrime(999981n), false);
    assert.equal(pr.isPrime(97n), true);
    for (let i = 2; i <= 2000; i++) {
        assert.equal(pr.isPrime(BigInt(i)), pr.isPrime(i), `mismatch at n=${i}`);
    }
});

test('isPrime - deterministic Miller-Rabin extends correctly to the 13-base/41 tier', () => {
    const TWO64 = 18446744073709551616n;
    // largest known prime below 2^64
    assert.equal(pr.isPrime(TWO64 - 59n), true);
    // within the new tier (2^64 to ~3.3e24): a constructed composite with a
    // small factor must still be caught
    const composite = (TWO64 * 1000003n) + 3n; // divisible by 3
    assert.equal(pr.isPrime(composite), false);
});

test('isPrime - invalid or non-integer input returns false instead of throwing', () => {
    const invalidInputs = ['12.5', 12.5, '7.0', Infinity, -Infinity, NaN, 'Infinity', 'NaN', null, undefined, {}, 'abc', '', '  7'];
    for (const v of invalidInputs) {
        assert.equal(pr.isPrime(v), false, `expected false for ${JSON.stringify(v)}`);
    }
    // legitimate inputs are unaffected
    assert.equal(pr.isPrime('+7'), true);
    assert.equal(pr.isPrime('-7'), false);
    assert.equal(pr.isPrime(13), true);
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

test('isPrime - very large BigInt beyond deterministic base range (Baillie-PSW path)', () => {
    const m127 = (2n ** 127n) - 1n; // known Mersenne prime
    assert.equal(pr.isPrime(m127, 7, 25, true), true);
    assert.equal(pr.isPrime(m127 - 2n, 7, 25, true), false);

    // 157-digit Mersenne prime: exercises Baillie-PSW well beyond 2^64
    const m521 = (2n ** 521n) - 1n;
    assert.equal(pr.isPrime(m521), true);
    assert.equal(pr.isPrime(m521 - 2n), false);

    // A large product of two known large primes: guaranteed composite, no small factors
    const bigComposite = ((2n ** 127n) - 1n) * ((2n ** 89n) - 1n);
    assert.equal(pr.isPrime(bigComposite), false);
});

test('isPrime - Baillie-PSW correctly rejects known strong pseudoprimes to base 2', () => {
    // These fool a bare Miller-Rabin base-2 test alone; the Lucas half of
    // Baillie-PSW must still catch them. Forced through Miller-Rabin/BPSW
    // via forceMillerRabin since they're small enough to normally take the
    // classic trial-division path (which would also catch them, just not
    // via the code path this test targets).
    const strongPseudoprimesBase2 = [2047n, 3277n, 4033n, 4681n, 8321n, 15841n, 29341n, 90751n];
    for (const p of strongPseudoprimesBase2) {
        assert.equal(pr.isPrime(p, 7, 5, true), false, `${p} should be composite`);
    }
});

test('isPrime - Baillie-PSW correctly rejects known Lucas pseudoprimes', () => {
    // These fool a Lucas test alone; the Miller-Rabin base-2 half must catch them.
    const lucasPseudoprimes = [323n, 377n, 1159n, 1829n, 5459n, 5777n, 9071n, 9179n];
    for (const p of lucasPseudoprimes) {
        assert.equal(pr.isPrime(p, 7, 5, true), false, `${p} should be composite`);
    }
});

test('isPrime - Baillie-PSW agrees with classic trial division for every integer up to 200,000', () => {
    for (let n = 2; n <= 200000; n++) {
        assert.equal(
            pr.isPrime(BigInt(n), 7, 5, true),
            pr.isPrime(n, 99, undefined, false, true),
            `mismatch at n=${n}`
        );
    }
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

test('sieve-backed bulk functions match known prime-counting values', () => {
    // pi(999999) = 78498 (OEIS A000720)
    assert.equal(pr.primesSmallerThan(1000000).length, 78498);
    assert.equal(pr.firstNPrimes(10000)[9999], 104729); // the 10000th prime
    assert.equal(pr.primesBetween(1, 100).length, 25); // 25 primes below 100
});

test('primeDivisors / primeDivisorsSum / primeDivisorsTimes', () => {
    assert.deepEqual(pr.primeDivisors(42), [2, 3, 7]);
    assert.deepEqual(pr.primeDivisors(12), [2, 3]);
    assert.equal(pr.primeDivisorsSum(42), 12);
    assert.equal(pr.primeDivisorsTimes(42), 42);
    assert.equal(pr.primeDivisors(13), false);
});

test('primeDivisors terminates on 0, 1 and negatives instead of looping forever', () => {
    // n /= 2 on n === 0 never terminates; this regressed when primeDivisors
    // switched to dividing factors out instead of scanning up to val.
    assert.deepEqual(pr.primeDivisors(0), []);
    assert.deepEqual(pr.primeDivisors(1), []);
    assert.deepEqual(pr.primeDivisors(-4), [2]);
    assert.deepEqual(pr.isPrimeOrDivisors(0), []);
});

test('primeDivisors factors values past 2^53 exactly, for BigInt and string input', () => {
    const n = 13354124587972147317351777779793215477n;
    const expected = [13n, 67n, 6714647n, 12998431n, 50582263n, 3472840952557n];
    assert.deepEqual(pr.primeDivisors(n), expected);
    assert.deepEqual(pr.primeDivisors(n.toString()), expected);
    assert.equal(expected.reduce((a, b) => a * b, 1n), n); // squarefree here, so the product is n
    assert.equal(pr.primeDivisorsTimes(n), n);

    // a hard semiprime with no small factors still resolves via Pollard's rho
    const semiprime = 99999999999973n * 99999999999959n;
    assert.deepEqual(pr.primeDivisors(semiprime), [99999999999959n, 99999999999973n]);
});

test('isPrime and primeDivisors refuse Numbers that JavaScript already rounded', () => {
    // 1.3354124587972147e+37 is not the number the caller wrote -- answering
    // about it would be answering about a different number entirely.
    assert.throws(() => pr.isPrime(13354124587972147317351777779793215477), RangeError);
    assert.throws(() => pr.primeDivisors(13354124587972147317351777779793215477), RangeError);
    // the exact same value as a BigInt or string is answered normally
    assert.equal(pr.isPrime(13354124587972147317351777779793215477n), false);
    assert.equal(pr.isPrime('13354124587972147317351777779793215477'), false);
});

test('isMersennePrime / nthMersennePrime / nthMersennePrimeExponents', () => {
    assert.equal(pr.isMersennePrime(127), true);
    assert.equal(pr.isMersennePrime(13), false);
    assert.equal(pr.nthMersennePrime(5), 8191);
    assert.equal(pr.nthMersennePrime(0), false);
    assert.equal(pr.nthMersennePrimeExponents(5), 13);
    assert.equal(pr.nthMersennePrimeExponents(0), false);
});

test('nthMersennePrime stays exact past 2^53 (Math.pow precision regression)', () => {
    // orders 9 and 10 need more than 53 bits; Math.pow(2, i) - 1 could not
    // represent them, and the old implementation hung searching for them.
    assert.equal(pr.nthMersennePrime(8), 2147483647);
    assert.equal(pr.nthMersennePrime(9), 2305843009213693951n);
    assert.equal(pr.nthMersennePrime(10), 618970019642690137449562111n);
    assert.equal(pr.nthMersennePrimeExponents(9), 61);
    assert.equal(pr.nthMersennePrimeExponents(10), 89);
    assert.equal(pr.isMersennePrime(2305843009213693951n), true);
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
    assert.equal(pr.phi(36), 12); // 36 = 2^2 * 3^2, so multiplicity matters here
    assert.equal(pr.phi(12), 4);
    assert.equal(pr.totient(5), 4);
    assert.equal(pr.phi(97), 96); // prime: phi(p) = p - 1
    // brute-force cross-check against the definition
    for (let n = 1; n <= 300; n++) {
        let count = 0;
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        for (let k = 1; k <= n; k++) if (gcd(n, k) === 1) count++;
        assert.equal(pr.phi(n), count, `phi(${n})`);
    }
});

test('phi stays exact for BigInt input past 2^53', () => {
    const n = 13354124587972147317351777779793215477n;
    // n is squarefree, so phi(n) = prod(p - 1) over its prime divisors
    const expected = pr.primeDivisors(n).reduce((a, p) => a * (p - 1n), 1n);
    assert.equal(pr.phi(n), expected);
    assert.equal(pr.phi(2305843009213693951n), 2305843009213693950n); // prime
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

test('nthTruncatablePrime is bounded: exactly 11 exist, and it must not search past them', () => {
    // 23, 37, 53, 73, 313, 317, 373, 797, 3137, 3797, 739397 (OEIS A020994) is
    // the complete, proven list, so n >= 12 has no answer. The old loop kept
    // searching forever, and re-derived nthPrime(counter) from scratch each
    // iteration on top of that.
    const all = [23, 37, 53, 73, 313, 317, 373, 797, 3137, 3797, 739397];
    all.forEach((expected, i) => assert.equal(pr.nthTruncatablePrime(i + 1), expected));
    assert.equal(pr.nthTruncatablePrime(12), false);
    assert.equal(pr.nthTruncatablePrime(50), false);
    assert.equal(pr.nthTruncatablePrime(0), false);
});

test('nthPrimesSum / nthPrimesTimes resolve every index in one pass', () => {
    assert.equal(pr.nthPrimesSum(3, 5, 7), 33);
    assert.equal(pr.nthPrimesTimes(3, 5, 7), 935);
    // unsorted, duplicated and out-of-range indexes behave as before
    assert.equal(pr.nthPrimesSum(7, 5, 3), 33);
    assert.equal(pr.nthPrimesSum(5, 5, 5), 33);
    assert.equal(pr.nthPrimesSum(1), 2);
    // the natural "first N primes" call used to be O(N^2)
    const args = Array.from({ length: 1000 }, (_, i) => i + 1);
    assert.equal(pr.nthPrimesSum(...args), 3682913); // sum of the first 1000 primes
});

test('helpers accept BigInt and stay exact past 2^53', () => {
    // sum/times compose with the BigInt arrays primeDivisors returns
    const n = 13354124587972147317351777779793215477n;
    assert.equal(pr.times(pr.primeDivisors(n)), n); // squarefree, so rad(n) === n
    assert.equal(typeof pr.sum(pr.primeDivisors(n)), 'bigint');
    assert.equal(pr.sum([2, 3, 4]), 9); // Number input still gives a Number
    assert.equal(pr.times([2, 3, 4]), 24);

    // isEmirp must not call a palindromic BigInt prime an emirp
    assert.equal(pr.isEmirp(101n), false);
    assert.equal(pr.isEmirp(13n), true);

    assert.deepEqual(pr.hasTwinPrime(5n), [3n, 7n]);
    assert.deepEqual(pr.hasTwinPrime(5), [3, 7]);

    assert.equal(pr.digits(13n), 2);
    assert.equal(pr.digits(1e21), 22); // String(1e21) is "1e+21", which reads as 5
    assert.equal(pr.beautifyInteger(1e21), '1.000.000.000.000.000.000.000');
    assert.deepEqual(pr.integerToArray(123n), [1, 2, 3]);
    assert.equal(pr.reverseNumber(123456), 654321);

    assert.equal(pr.closestPrime(100000000000000000n), 100000000000000003n);
    assert.equal(pr.closestPrime(25), 23);
});

test('randomPrime stays inside the requested range, at any size', () => {
    for (let i = 0; i < 25; i++) {
        const v = pr.randomPrime(25, 48);
        assert.ok(v >= 25 && v <= 48 && pr.isPrime(v), `${v} outside [25,48] or not prime`);
    }
    const big = pr.randomPrimeDigits(20);
    assert.equal(String(big).length, 20);
    assert.equal(pr.isPrime(big), true);
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
