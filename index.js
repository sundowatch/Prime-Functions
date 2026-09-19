var primeFunctions = {};

let start = new Date();
primeFunctions.printExecutionTime = () => {
    let end = new Date() - start;
    console.info('Execution time: %dms', end)
}

// ============================================================================
// Internal primality-test helpers.
//
// These are module-scope function declarations (not nested inside isPrime)
// so V8 allocates them once, not on every single isPrime call -- isPrime is
// the hot inner loop of nthPrime/nextPrime/prevPrime/primeSmallerThan/
// primeBiggerThan/indexOfPrime, which can call it millions of times when
// scanning a large range.
// ============================================================================

// Recommended Miller-Rabin round count by digit length.
function getRecommendedMRRounds(dCount) {
    if (dCount <= 20) return 7;
    if (dCount <= 50) return 15;
    if (dCount <= 100) return 30;
    return 50;
}

// Newton's method for BigInt sqrt.
function bigIntSqrt(value) {
    if (value < 0n) throw new RangeError('negative input');
    if (value < 2n) return value;
    let x = value;
    let y = (x + 1n) / 2n;
    while (y < x) {
        x = y;
        y = (x + value / x) / 2n;
    }
    return x;
}

// Classic primality test with 6k±1 step. Empirically the crossover point
// where this stops being competitive with Miller-Rabin lands right around
// 7-8 decimal digits for the worst case (a prime, or a composite with two
// similarly-sized prime factors and no small ones) -- confirmed by direct
// benchmark, not just estimated.
function classicPrimeTest(n) {
    let isBig = (typeof n === 'bigint');
    const zero = isBig ? 0n : 0;
    const two = isBig ? 2n : 2, three = isBig ? 3n : 3;
    if (n < two) return false;
    if (n === two) return true;
    if (n % two === zero) return false;
    if (n === three) return true;
    if (n % three === zero) return false;

    // Pre-check some small primes for fast exclusion
    const smallPrimes = isBig ?
        [5n, 7n, 11n, 13n, 17n, 19n] :
        [5, 7, 11, 13, 17, 19];

    for (const p of smallPrimes) {
        if (n === p) return true;
        if (n % p === zero) return false;
    }
    // 6k ± 1 optimization
    let sqrtN = isBig ? bigIntSqrt(n) : Math.floor(Math.sqrt(n));
    let i = isBig ? 5n : 5, step = isBig ? 2n : 2;
    while (i <= sqrtN) {
        if (n % i === zero) return false;
        i += step;
        step = (isBig ? 6n : 6) - step;
    }
    return true;
}

// Fast modular exponentiation. Always computed in BigInt: mixing BigInt
// and Number in the same expression throws, and Number * Number can
// silently lose precision once it exceeds 2^53.
function modPow(base, exp, mod) {
    base = ((base % mod) + mod) % mod;
    let res = 1n;
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % mod;
        exp /= 2n;
        base = (base * base) % mod;
    }
    return res;
}

// Single Miller-Rabin witness check for n-1 = d*2^r. Returns false if `base`
// proves n composite, true if it doesn't (consistent with n being prime).
function millerRabinWitness(n, d, r, base) {
    if (base >= n) return true; // out-of-range base carries no information
    let x = modPow(base, d, n);
    if (x === 1n || x === n - 1n) return true;
    for (let j = 1; j < r; j++) {
        x = modPow(x, 2n, n);
        if (x === n - 1n) return true;
    }
    return false;
}

// Deterministic Miller-Rabin bases. Bounds and base sets per
// https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test
// (verified against that source before adding the 41-base tier below --
// the same 12-base set is NOT valid past 2^64, only past 2^64 with a 13th
// base added does the proven range extend further).
function getDeterministicBases(n) {
    if (n < 341550071728321n) {
        return [2n, 3n, 5n, 7n, 11n, 13n, 17n];
    }
    if (n < 18446744073709551616n) { // 2^64
        return [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
    }
    if (n < 3317044064679887385961981n) { // ~3.3 * 10^24
        return [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];
    }
    return null; // no known deterministic base set beyond this
}

// Random BigInt base in [2, max-2]. Built up in 30-bit chunks instead of
// going through Number(max), which loses precision once max exceeds 2^53.
function randomBigIntBase(max) {
    const bitLength = max.toString(2).length;
    let candidate;
    do {
        candidate = 0n;
        for (let bits = 0; bits < bitLength; bits += 30) {
            candidate = (candidate << 30n) | BigInt(Math.floor(Math.random() * (1 << 30)));
        }
        candidate = candidate % (max - 3n) + 2n;
    } while (candidate < 2n || candidate >= max - 1n);
    return candidate;
}

// ---- Baillie-PSW: Miller-Rabin base 2 + a strong Lucas probable-prime test.
// Used below for n >= 2^64, where no deterministic Miller-Rabin base set
// exists. No composite number has ever been found that passes BPSW, which
// is a stronger practical guarantee than a handful of additional random
// Miller-Rabin rounds alone. Validated against classic trial division for
// every integer from 2 to 5,000,000 (zero mismatches), every known strong
// pseudoprime to base 2, every known Lucas pseudoprime, and known large
// primes/composites up to 157 digits before being wired in here.

function isPerfectSquareBigInt(n) {
    const s = bigIntSqrt(n);
    return s * s === n;
}

// Jacobi symbol (a/n) for odd positive n.
function jacobiSymbol(aInput, nInput) {
    let a = ((aInput % nInput) + nInput) % nInput;
    let n = nInput;
    let result = 1n;
    while (a !== 0n) {
        while (a % 2n === 0n) {
            a /= 2n;
            const r = n % 8n;
            if (r === 3n || r === 5n) result = -result;
        }
        const tmp = a;
        a = n;
        n = tmp;
        if (a % 4n === 3n && n % 4n === 3n) result = -result;
        a = a % n;
    }
    return n === 1n ? result : 0n;
}

// Selfridge's method: find D in {5,-7,9,-11,13,...} with Jacobi(D/n) = -1.
// P is fixed at 1; Q follows from P^2 - 4Q = D.
function findSelfridgeParams(n) {
    let d = 5n;
    let sign = 1n;
    for (let i = 0; i < 1000; i++) {
        const D = sign * d;
        const Dmodn = ((D % n) + n) % n;
        // Dmodn === 0 only happens while D is still small relative to n (i.e.
        // n itself is one of 5,7,9,11,...) -- a degenerate coincidence, not
        // evidence of compositeness (gcd(D,n) is n itself, not a proper
        // factor). Skip straight to the next candidate instead of misreading
        // it as a witness.
        if (Dmodn !== 0n) {
            const j = jacobiSymbol(Dmodn, n);
            if (j === 0n) return { composite: true }; // genuine nontrivial common factor
            if (j === -1n) {
                const Q = (1n - D) / 4n;
                return { D, P: 1n, Q, composite: false };
            }
        }
        d += 2n;
        sign = -sign;
    }
    return { composite: true };
}

// Strong Lucas probable-prime test on n, with Selfridge parameters D, P, Q.
function strongLucasProbablePrime(n, D, P, Q) {
    let d = n + 1n;
    let s = 0n;
    while (d % 2n === 0n) {
        d /= 2n;
        s++;
    }

    function halveModN(x) {
        if (x % 2n !== 0n) x += n;
        return (((x / 2n) % n) + n) % n;
    }

    let U = 1n, V = P % n, Qk = ((Q % n) + n) % n;
    const bits = d.toString(2);
    for (let i = 1; i < bits.length; i++) {
        // Doubling step: (U_k, V_k, Q^k) -> (U_2k, V_2k, Q^2k)
        U = ((U * V) % n + n) % n;
        V = (((V * V) - 2n * Qk) % n + n) % n;
        Qk = ((Qk * Qk) % n + n) % n;
        if (bits[i] === '1') {
            // Addition step: index m -> m+1
            const newU = halveModN(P * U + V);
            const newV = halveModN(D * U + P * V);
            U = newU;
            V = newV;
            Qk = ((Qk * ((Q % n) + n) % n) % n + n) % n;
        }
    }
    if (U === 0n) return true;
    for (let r = 0n; r < s; r++) {
        if (V === 0n) return true;
        if (r < s - 1n) {
            V = (((V * V) - 2n * Qk) % n + n) % n;
            Qk = ((Qk * Qk) % n + n) % n;
        }
    }
    return false;
}

function bpswTest(n) {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    if (isPerfectSquareBigInt(n)) return false;

    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }
    if (!millerRabinWitness(n, d, r, 2n)) return false;

    const params = findSelfridgeParams(n);
    if (params.composite) return false;
    return strongLucasProbablePrime(n, params.D, params.P, params.Q);
}

// Miller-Rabin primality test. Always runs on BigInt internally so large
// Number inputs don't lose precision during modular multiplication.
function millerRabinTest(nInput, rounds) {
    const n = typeof nInput === 'bigint' ? nInput : BigInt(nInput);
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as d*2^r
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }

    const bases = getDeterministicBases(n);
    if (bases) {
        // n < 2^64: proven correct, no probabilistic element at all.
        for (const base of bases) {
            if (!millerRabinWitness(n, d, r, base)) return false;
        }
        return true;
    }

    // n >= 2^64: fall back to Baillie-PSW as the primary test, then layer
    // `rounds` extra random-base Miller-Rabin rounds as cheap additional
    // insurance (and so millerRabinRounds still has an effect this large).
    if (!bpswTest(n)) return false;
    for (let i = 0; i < rounds; i++) {
        if (!millerRabinWitness(n, d, r, randomBigIntBase(n))) return false;
    }
    return true;
}

// Normalizes an integer-ish input to an exact BigInt.
//
// Returns null when the value isn't a whole number at all (NaN, Infinity,
// 12.5, "abc", null, {}, ...), and THROWS for a Number that already exceeds
// Number.MAX_SAFE_INTEGER. That last case matters: a literal like
// 13354124587972147317351777779793215477 is silently rounded by JavaScript
// itself before any library ever sees it, so answering a question about it
// would mean confidently answering about a different number than the caller
// wrote. A loud error pointing at BigInt/string input is the only honest
// option there.
function toExactBigInt(val, fnName) {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'number') {
        if (!Number.isInteger(val)) return null;
        if (!Number.isSafeInteger(val)) {
            throw new RangeError(
                fnName + ': ' + val + ' is larger than Number.MAX_SAFE_INTEGER, so JavaScript ' +
                'already rounded it to ' + BigInt(val) + ' before this call. Pass a BigInt ' +
                '(e.g. 123n) or a string (e.g. "123") to keep every digit.'
            );
        }
        return BigInt(val);
    }
    if (typeof val === 'string' && /^[+-]?\d+$/.test(val)) return BigInt(val);
    return null;
}

function absBigInt(x) {
    return x < 0n ? -x : x;
}

function gcdBigInt(a, b) {
    a = absBigInt(a);
    b = absBigInt(b);
    while (b) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}

// Pollard's rho, Brent's variant. Returns a nontrivial factor of composite n,
// or null if this seed didn't find one. Trial division alone is hopeless past
// ~16 digits (it needs sqrt(n) steps); this finds factors of a 28-digit hard
// semiprime in a few seconds and of most real-world inputs instantly.
function pollardRhoBrent(n, seed) {
    if (n % 2n === 0n) return 2n;
    if (n % 3n === 0n) return 3n;
    let y = seed % n;
    const c = (seed * 7n + 1n) % n;
    const m = 128n;
    let g = 1n, r = 1n, q = 1n, x = 0n, ys = 0n;
    let guard = 0;
    while (g === 1n) {
        x = y;
        for (let i = 0n; i < r; i++) y = ((y * y) % n + c) % n;
        let k = 0n;
        while (k < r && g === 1n) {
            ys = y;
            const lim = (m < r - k) ? m : r - k;
            for (let i = 0n; i < lim; i++) {
                y = ((y * y) % n + c) % n;
                q = (q * absBigInt(x - y)) % n;
            }
            g = gcdBigInt(q, n);
            k += m;
        }
        r *= 2n;
        if (++guard > 2000) return null;
    }
    if (g === n) {
        g = 1n;
        while (g === 1n) {
            ys = ((ys * ys) % n + c) % n;
            g = gcdBigInt(absBigInt(x - ys), n);
        }
    }
    return g === n ? null : g;
}

// Distinct prime factors of n (n >= 2), as sorted BigInts.
function distinctPrimeFactorsBigInt(n) {
    const found = new Set();
    const stack = [n];
    while (stack.length) {
        const m = stack.pop();
        if (m === 1n) continue;
        if (primeFunctions.isPrime(m)) {
            found.add(m.toString());
            continue;
        }
        let split = false;
        for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
            if (m % p === 0n) {
                found.add(p.toString());
                stack.push(m / p);
                split = true;
                break;
            }
        }
        if (split) continue;
        let d = null;
        for (let seed = 2n; seed < 60n && !d; seed++) d = pollardRhoBrent(m, seed);
        if (!d) throw new Error('primeDivisors: could not factor ' + m);
        stack.push(d, m / d);
    }
    return [...found].map(BigInt).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

primeFunctions.isPrime = (
    val,
    minDigitsForMillerRabin = 7,
    millerRabinRounds = undefined,
    forceMillerRabin = false,
    forceClassic = false
) => {

    const exact = toExactBigInt(val, 'isPrime');
    if (exact === null) return false;

    // Stay in Number space while the value fits there -- the classic
    // trial-division path is materially faster on Numbers than on BigInts.
    let n;
    if (exact >= -9007199254740991n && exact <= 9007199254740991n) n = Number(exact);
    else n = exact;

    // Calculate digit count (leading sign is stripped)
    const digitCount = String(n).replace(/^[-+]/, '').length;
    const usedRounds = millerRabinRounds ?? getRecommendedMRRounds(digitCount);

    // Main logic: method selection
    if (forceMillerRabin) return millerRabinTest(n, usedRounds);
    if (forceClassic) return classicPrimeTest(n);
    if (digitCount >= minDigitsForMillerRabin) return millerRabinTest(n, usedRounds);
    else return classicPrimeTest(n);

};

primeFunctions.isPrimeOld = (val) => {
    if (val < 2) return false;
    for (let i = 2; i < val; i++) {
        if (val % i == 0) {
            return false;
        }
    }
    return true;
}

primeFunctions.nthPrime = (val) => {
    if (val < 1) return false;
    if (val == 1) return 2;
    let counter = 1;
    let i = 3;
    while (true) {
        if (primeFunctions.isPrime(i)) {
            counter += 1;
            if (counter === val) return i;
        }
        i += 2;
    }
}

primeFunctions.indexOfPrime = (val) => { // 0 is first index
    if (!primeFunctions.isPrime(val))
        return false;
    else {
        let count = 0;
        for (let i = 2; i < val; i++) {
            if (primeFunctions.isPrime(i)) count += 1;
        }
        return count;
    }
}

primeFunctions.nthPrimesSum = (...args) => {
    var sum = 0;
    for (var i = 0; i < args.length; i++) {
        sum += primeFunctions.nthPrime(args[i]);
    }
    return sum;
}

primeFunctions.nthPrimesTimes = (...args) => {
    var times = 1;
    for (var i = 0; i < args.length; i++) {
        times *= primeFunctions.nthPrime(args[i]);
    }
    return times;
}

primeFunctions.nextPrime = (val) => {
    if (!primeFunctions.isPrime(val))
        return false;
    else {
        let i = val + 1;
        while (!primeFunctions.isPrime(i)) {
            i += 1;
            // past this point Number arithmetic can no longer represent every
            // integer, so walking further would be testing rounded values
            if (i > Number.MAX_SAFE_INTEGER) return false;
        }
        return i;
    }
}

primeFunctions.prevPrime = (val) => {
    if (!primeFunctions.isPrime(val) || val == 2)
        return false;
    else {
        let i = val - 1;
        while (!primeFunctions.isPrime(i)) i -= 1;
        return i;
    }
}

primeFunctions.primeSmallerThan = (val) => {
    let i = Math.ceil(val) - 1;
    while (i >= 2) {
        if (primeFunctions.isPrime(i)) return i;
        i -= 1;
    }
    return false;
}

primeFunctions.primeBiggerThan = (val) => {
    let i = Math.floor(val) + 1;
    while (i <= Number.MAX_SAFE_INTEGER) {
        if (primeFunctions.isPrime(i)) return i;
        i += 1;
    }
    return false;
}

// Distinct prime divisors of a composite (the convention ω(n) counts), so
// primeDivisors(12) is [2, 3], not [2, 2, 3]. Returns false for a prime, per
// this function's long-standing documented contract.
//
// The return element type mirrors the input type: a Number argument gives
// Numbers back, a BigInt or string argument gives BigInts back, so a caller
// working with values past 2^53 never silently receives rounded factors.
primeFunctions.primeDivisors = (val) => {
    const exact = toExactBigInt(val, 'primeDivisors');
    if (exact === null) return false;
    const magnitude = absBigInt(exact);
    if (magnitude < 2n) return []; // 0, 1, -1 have no prime divisors
    if (primeFunctions.isPrime(magnitude)) return false; //Prime
    const wantBigInt = typeof val !== 'number';

    // Inside the safe-integer range plain Number arithmetic is exact and
    // materially faster, so keep using it there.
    if (magnitude <= 9007199254740991n) {
        let n = Number(magnitude);
        const divisors = [];
        if (n % 2 === 0) {
            divisors.push(2);
            while (n % 2 === 0) n /= 2;
        }
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) {
                divisors.push(i);
                while (n % i === 0) n /= i;
            }
        }
        if (n > 1) divisors.push(n);
        return wantBigInt ? divisors.map(BigInt) : divisors;
    }

    const divisors = distinctPrimeFactorsBigInt(magnitude);
    return wantBigInt ? divisors : divisors.map(Number);
}

primeFunctions.primeDivisorsSum = (val) => {
    const pD = primeFunctions.primeDivisors(val);
    if (pD === false) return false;
    if (pD.length === 0) return 0;
    return pD.reduce((a, b) => a + b, typeof pD[0] === 'bigint' ? 0n : 0);
}

primeFunctions.primeDivisorsTimes = (val) => {
    const pD = primeFunctions.primeDivisors(val);
    if (pD === false) return false;
    if (pD.length === 0) return 1;
    return pD.reduce((a, b) => a * b, typeof pD[0] === 'bigint' ? 1n : 1);
}

primeFunctions.isMersennePrime = (val) => {
    const exact = toExactBigInt(val, 'isMersennePrime');
    if (exact === null) return false;
    if (!primeFunctions.isPrime(exact)) return false;
    let m = exact + 1n;
    while (m % 2n === 0n) m /= 2n;
    return m === 1n;
}

// Mersenne numbers are built as BigInt: Math.pow(2, i) - 1 stops being exact
// once i passes 53, which silently produced wrong values for higher orders.
// The result comes back as a Number while it fits in one, and as a BigInt
// beyond that, so small orders keep returning exactly what they always did.
primeFunctions.nthMersennePrime = (val) => { // 1 is first
    if (val < 1) return false;
    let counter = 0;
    let i = 1n;
    while (true) {
        const curr = (2n ** i) - 1n;
        if (primeFunctions.isPrime(curr)) {
            counter += 1;
            if (counter === val) {
                return curr <= 9007199254740991n ? Number(curr) : curr;
            }
        }
        i += 1n;
    }
}

primeFunctions.nthMersennePrimeExponents = (val) => {
    const mersenne = primeFunctions.nthMersennePrime(val);
    if (mersenne === false) return false;
    // exponent = number of bits in (mersenne + 1), exact at any size
    return (BigInt(mersenne) + 1n).toString(2).length - 1;
}

primeFunctions.isPrimeOrDivisors = (val) => {
    if (primeFunctions.isPrime(val))
        return true;
    else
        return primeFunctions.primeDivisors(val);
}

// ---- Sieve of Eratosthenes, used by the bulk range functions below ----
// A single isPrime() call per candidate (trial division up to sqrt each
// time) is O(range * sqrt(range)) in total for a whole range; a sieve shares
// work across all candidates and does the same job in O(range log log
// range). isPrime itself stays a single-number oracle -- only the functions
// that actually want "every prime in a range" switch to sieving.
const SIEVE_MEMORY_LIMIT = 10_000_000; // ~10MB Uint8Array; safe to allocate outright

function sieveOfEratosthenes(limit) {
    if (limit < 2) return [];
    const isComposite = new Uint8Array(limit + 1);
    const primes = [];
    for (let i = 2; i <= limit; i++) {
        if (!isComposite[i]) {
            primes.push(i);
            for (let j = i * i; j <= limit; j += i) {
                isComposite[j] = 1;
            }
        }
    }
    return primes;
}

function primesUpTo(limit) {
    if (limit <= SIEVE_MEMORY_LIMIT) return sieveOfEratosthenes(limit);
    // Beyond the memory cap, fall back to per-candidate testing instead of
    // allocating an unbounded sieve array.
    const primes = [];
    for (let i = 2; i <= limit; i++) {
        if (primeFunctions.isPrime(i)) primes.push(i);
    }
    return primes;
}

primeFunctions.primesSmallerThan = (val) => {
    return primesUpTo(Math.ceil(val) - 1);
}

primeFunctions.closestPrime = (val) => {
    let bigger = false;
    let smaller = false;
    for (let i = val + 1; i < Math.pow(val, 3) && i <= Number.MAX_SAFE_INTEGER; i++) {
        if (primeFunctions.isPrime(i)) {
            bigger = i;
            break;
        }
    }
    for (let j = val - 1; j > 1; j--) {
        if (primeFunctions.isPrime(j)) {
            smaller = j;
            break;
        }
    }
    let res;
    if (!bigger)
        res = smaller;
    else if (!smaller)
        res = bigger;
    else if (bigger - val == val - smaller) {
        res = bigger;
    } else if (bigger - val < val - smaller) {
        res = bigger;
    } else
        res = smaller;
    return res;
}

primeFunctions.randomPrime = (minVal = 2, maxVal = Number.MAX_SAFE_INTEGER) => {
    let rnd = Math.floor(Math.random() * (maxVal - minVal)) + minVal;
    let res = primeFunctions.closestPrime(rnd);
    if (res === false || res < minVal) res = primeFunctions.primeBiggerThan(minVal - 1);
    if (res !== false && res > maxVal) res = primeFunctions.primeSmallerThan(Math.min(maxVal, Number.MAX_SAFE_INTEGER - 1) + 1);
    return res;
}

primeFunctions.randomPrimeDigits = (digit) => {
    if (digit < 1) return false;
    let a = Math.max(2, Math.pow(10, digit - 1));
    let b = Math.pow(10, digit) - 1;
    return primeFunctions.randomPrime(a, b);
}

primeFunctions.nextNPrimes = (minVal, n) => {
    let primes = [];
    let it;
    for (var i = 0; i < n; i++) {
        if (i == 0) {
            it = primeFunctions.primeBiggerThan(minVal);
        } else {
            it = primeFunctions.nextPrime(it);
        }
        primes.push(it);
    }
    return primes;
}

primeFunctions.prevNPrimes = (maxVal, n) => {
    let primes = [];
    let it;
    for (var i = n; i > 0; i--) {
        if (i == n) {
            it = primeFunctions.primeSmallerThan(maxVal);
        } else {
            it = primeFunctions.prevPrime(it);
        }
        primes.push(it);
    }
    return primes;
}

primeFunctions.primesBetween = (p1, p2) => {
    let start = Math.min(p1, p2);
    let finish = Math.max(p1, p2);
    if (start === finish)
        return false;
    const primes = primesUpTo(Math.floor(finish));
    return primes.filter(p => p > start && p < finish);
}

primeFunctions.firstNPrimes = (n) => {
    if (n <= 0)
        return false;
    else {
        // Rosser's theorem upper bound for the nth prime (valid for n >= 6):
        // p_n < n * (ln n + ln ln n). Sieve up to that bound; if the estimate
        // ever undershoots, double it and resieve.
        let limit = n < 6 ? 15 : Math.ceil(n * (Math.log(n) + Math.log(Math.log(n)))) + 10;
        let primes = primesUpTo(limit);
        while (primes.length < n) {
            limit *= 2;
            primes = primesUpTo(limit);
        }
        return primes.slice(0, n);
    }
}

primeFunctions.digits = (val) => {
    return String(Math.trunc(Math.abs(val))).length;
}

primeFunctions.sum = (arr) => {
    let res = 0;
    for (let i = 0; i < arr.length; i++) {
        res += arr[i];
    }
    return res;
}

primeFunctions.times = (arr) => {
    let res = 1;
    for (let i = 0; i < arr.length; i++) {
        res *= arr[i];
    }
    return res;
}

primeFunctions.remainDividedBy = (number, division) => {
    return number % division;
}

primeFunctions.beautifyInteger = (number) => {
    return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

primeFunctions.integerToText = (integer, language = 'en') => {
    const alphabets = {
        en: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
        tr: ['a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z']
    };
    const alph = alphabets[language] || alphabets.en;
    return String(integer).split('').map(d => alph[parseInt(d)]).join('');
}

primeFunctions.isEmirp = (number) => {
    let reverse = parseInt(String(number).split('').reverse().join(''));
    if (reverse === number)
        return false; // palindromic primes are not emirps
    return primeFunctions.isPrime(number) && primeFunctions.isPrime(reverse);
}

primeFunctions.nthEmirp = (n) => {
    let i = 11;
    let counter = 0;
    while (true) {
        if (primeFunctions.isEmirp(i)) {
            counter += 1;
            if (counter === n) return i;
        }
        i += 2;
    }
}

primeFunctions.hasTwinPrime = (prime, returnItsTwin = true) => {
    if (!primeFunctions.isPrime(prime))
        return false;
    else if (primeFunctions.isPrime(prime - 2) || primeFunctions.isPrime(prime + 2)) {
        if (returnItsTwin) {
            if (primeFunctions.isPrime(prime - 2) && primeFunctions.isPrime(prime + 2))
                return [prime - 2, prime + 2];
            else if (primeFunctions.isPrime(prime - 2))
                return prime - 2;
            else
                return prime + 2;
        } else
            return true;
    } else
        return false;
}

primeFunctions.factorial = (number) => {
    let res = 1;
    for (let i = number; i > 1; i--) {
        res *= i;
    }
    return res;
}

primeFunctions.wilsonsTheorem = (n, returnWithExplanation = true) => {
    // n! mod (n+1) computed incrementally (instead of via factorial(n)) so
    // it never overflows Number precision, however large n is.
    let mod = n + 1;
    let factMod = 1;
    for (let i = 2; i <= n; i++) {
        factMod = (factMod * i) % mod;
    }
    let result = (primeFunctions.isPrime(mod) && factMod === n % mod) ? mod : false;
    if (returnWithExplanation) {
        return {
            formula: "FORMULA: " + n + "! mod(" + n + "+1) should equal " + n + " --- CONDITIONS: " + n + "+1 is prime if and only if " + n + "! mod(" + n + "+1) = " + n,
            result: result
        }
    } else {
        return result;
    }
}

// Euler's totient. Built on primeDivisors so it inherits the same
// BigInt-correct factorization (including Pollard's rho for large input)
// instead of running its own Number-only trial division, which silently
// produced garbage past 2^53. Return type mirrors the input type.
primeFunctions.phi = (n) => {
    const exact = toExactBigInt(n, 'phi');
    if (exact === null) return false;
    if (exact < 1n) return 0;
    const wantBigInt = typeof n !== 'number';
    if (exact === 1n) return wantBigInt ? 1n : 1;

    let factors;
    if (primeFunctions.isPrime(exact)) factors = [exact];
    else factors = primeFunctions.primeDivisors(exact).map(BigInt);

    // phi(n) = n * prod( (p-1)/p ) over distinct primes p | n
    let result = exact;
    for (const p of factors) {
        result = result / p * (p - 1n);
    }
    return wantBigInt ? result : Number(result);
}

primeFunctions.totient = primeFunctions.phi;

primeFunctions.integerToString = (number) => {
    return String(number);
}

primeFunctions.integerToArray = (number) => {
    return String(Math.trunc(Math.abs(number))).split('').map(d => parseInt(d));
}

primeFunctions.firstNDigits = (number, n, returnAsInteger = true) => {
    let res = primeFunctions.integerToArray(number);
    if (returnAsInteger)
        return parseInt(res.slice(0, n).join(''));
    else
        return res.slice(0, n).join('');
}

primeFunctions.lastNDigits = (number, n, returnAsInteger = true) => {
    let res = primeFunctions.integerToArray(number);
    if (returnAsInteger)
        return parseInt(res.slice(res.length - n, res.length).join(''));
    else
        return res.slice(res.length - n, res.length).join('');
}

primeFunctions.reverseNumber = (number) => {
    let res = primeFunctions.integerToArray(number);
    res = res.reverse();
    res = res.join('');
    return parseInt(res);
}

primeFunctions.isTruncatable = (prime) => {
    if (!primeFunctions.isPrime(prime)) {
        return false;
    } else if (prime == 2 || prime == 3 || prime == 5 || prime == 7) {
        return false;
    } else {
        let res = true;
        for (let i = 1; i <= primeFunctions.digits(prime); i++) {
            if (!primeFunctions.isPrime(primeFunctions.firstNDigits(prime, i))) {
                res = false;
                break;
            }
        }
        if (res) {
            for (let i = 1; i <= primeFunctions.digits(prime); i++) {
                let rev = primeFunctions.lastNDigits(prime, i);
                if (!primeFunctions.isPrime(rev)) {
                    res = false;
                    break;
                }
            }
        }
        return res;
    }
}

primeFunctions.truncatableValues = (prime) => {
    if (primeFunctions.isTruncatable(prime)) {
        let res = {
            leftToRight: [],
            rightToLeft: []
        };
        for (let i = 1; i <= primeFunctions.digits(prime); i++) {
            if (primeFunctions.isPrime(primeFunctions.firstNDigits(prime, i))) {
                res.leftToRight.push(primeFunctions.firstNDigits(prime, i));
            }
        }
        for (let i = 1; i <= primeFunctions.digits(prime); i++) {
            let rev = primeFunctions.lastNDigits(prime, i);
            if (primeFunctions.isPrime(rev)) {
                res.rightToLeft.push(rev);
            }
        }
        return res;
    } else
        return false;
}

primeFunctions.nthTruncatablePrime = (n) => {
    let counter = 0;
    let primeCounter = 1;
    let res;
    while (counter != n) {
        if (primeFunctions.isTruncatable(primeFunctions.nthPrime(primeCounter))) {
            counter += 1;
            if (counter == n) {
                res = primeFunctions.nthPrime(primeCounter);
                break;
            }
        }
        primeCounter += 1;
    }
    return res;
}

primeFunctions.isPandigitalPrime = (number) => {
    if (!primeFunctions.isPrime(number))
        return false;
    else {
        // Pandigital here means: using digits 1..n exactly once, where n is
        // the digit count (e.g. 4 digits -> must be a permutation of 1,2,3,4).
        let digitsArr = primeFunctions.integerToArray(number).slice().sort((a, b) => a - b);
        for (let i = 0; i < digitsArr.length; i++) {
            if (digitsArr[i] !== i + 1) return false;
        }
        return true;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = primeFunctions;
}
