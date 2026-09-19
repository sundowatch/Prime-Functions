var primeFunctions = {};

let start = new Date();
primeFunctions.printExecutionTime = () => {
    let end = new Date() - start;
    console.info('Execution time: %dms', end)
}

primeFunctions.isPrime = (
    val,
    minDigitsForMillerRabin = 7,
    millerRabinRounds = undefined,
    forceMillerRabin = false,
    forceClassic = false
) => {

    // For small numbers (< 2^53) auto-convert to Number for classic speed; else use BigInt
    let n;
    if (typeof val === 'bigint') n = val;
    else if (typeof val === 'number' && Number.isSafeInteger(val)) n = val;
    else if (/^\d+$/.test(val)) {
        // For string input; decide based on length
        if (val.length <= 15) n = Number(val);
        else n = BigInt(val);
    } else {
        n = BigInt(val);
    }

    // Calculate digit count (leading sign is stripped)
    const digitCount = String(n).replace(/^[-+]/, '').length;

    // Recommended Miller-Rabin rounds table
    function getRecommendedMRRounds(dCount) {
        if (dCount <= 20) return 7;
        if (dCount <= 50) return 15;
        if (dCount <= 100) return 30;
        return 50;
    }
    const usedRounds = millerRabinRounds ?? getRecommendedMRRounds(digitCount);

    // Classic primality test with 6k±1 step
    function classicPrimeTest(n) {
        let isBig = (typeof n === 'bigint');
        const two = isBig ? 2n : 2, three = isBig ? 3n : 3;
        if (n < two) return false;
        if (n === two) return true;
        if (n % two === 0) return false;
        if (n === three) return true;
        if (n % three === 0) return false;

        // Pre-check some small primes for fast exclusion
        const smallPrimes = isBig ?
            [5n, 7n, 11n, 13n, 17n, 19n] :
            [5, 7, 11, 13, 17, 19];

        for (const p of smallPrimes) {
            if (n === p) return true;
            if (n % p === 0) return false;
        }
        // 6k ± 1 optimization
        let sqrtN = isBig ? bigIntSqrt(n) : Math.floor(Math.sqrt(n));
        let i = isBig ? 5n : 5, step = isBig ? 2n : 2;
        while (i <= sqrtN) {
            if (n % i === 0) return false;
            i += step;
            step = (isBig ? 6n : 6) - step;
        }
        return true;
    }

    // Newton's method for BigInt sqrt (can be globally used)
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

    // Fast modular exponentiation. Always computed in BigInt: mixing BigInt
    // and Number in the same expression throws, and Number * Number can
    // silently lose precision once it exceeds 2^53.
    function modPow(base, exp, mod) {
        base = base % mod;
        let res = 1n;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            exp /= 2n;
            base = (base * base) % mod;
        }
        return res;
    }

    // Helper to get deterministic bases for Miller-Rabin (valid for n < 2^64)
    function getDeterministicBases(n) {
        if (n < 341550071728321n) {
            // https://miller-rabin.appspot.com/ and OEIS
            return [2n, 3n, 5n, 7n, 11n, 13n, 17n];
        }
        // For even larger n < 2^64
        if (n < 18446744073709551616n) {
            return [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
        }
        return null; // should use probabilistic for larger n
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

    // Miller-Rabin primality test. Always runs on BigInt internally so large
    // Number inputs don't lose precision during modular multiplication.
    function millerRabinTest(nInput, rounds) {
        const n = typeof nInput === 'bigint' ? nInput : BigInt(nInput);
        if (n < 2n) return false;
        if (n === 2n || n === 3n) return true;
        if (n % 2n === 0n) return false;

        // Try deterministic bases for n < 2^64
        const bases = getDeterministicBases(n);
        let roundBases = bases;
        if (!bases) {
            roundBases = [];
            for (let i = 0; i < rounds; i++) {
                roundBases.push(randomBigIntBase(n));
            }
        }
        // Write n-1 as d*2^r
        let d = n - 1n;
        let r = 0;
        while (d % 2n === 0n) {
            d /= 2n;
            r++;
        }
        outer: for (const base of roundBases) {
            if (base >= n) continue;
            let x = modPow(base, d, n);
            if (x === 1n || x === n - 1n) continue;
            for (let j = 1; j < r; j++) {
                x = modPow(x, 2n, n);
                if (x === n - 1n) continue outer;
            }
            return false;
        }
        return true;
    }

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
        while (!primeFunctions.isPrime(i)) i += 1;
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
    while (true) {
        if (primeFunctions.isPrime(i)) return i;
        i += 1;
    }
}

primeFunctions.primeDivisors = (val) => {
    if (primeFunctions.isPrime(val))
        return false; //Prime
    else {
        let n = val;
        let divisors = [];
        if (n % 2 == 0) {
            divisors.push(2);
            while (n % 2 == 0) n /= 2;
        }
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i == 0) {
                divisors.push(i);
                while (n % i == 0) n /= i;
            }
        }
        if (n > 1) divisors.push(n);
        return divisors;
    }
}

primeFunctions.primeDivisorsSum = (val) => {
    if (primeFunctions.isPrime(val))
        return false;
    else {
        var pD = primeFunctions.primeDivisors(val);
        var res = 0;
        for (let i = 0; i < pD.length; i++) {
            res += pD[i];
        }
        return res;
    }
}

primeFunctions.primeDivisorsTimes = (val) => {
    if (primeFunctions.isPrime(val))
        return false;
    else {
        var pD = primeFunctions.primeDivisors(val);
        var res = 1;
        for (let i = 0; i < pD.length; i++) {
            res *= pD[i];
        }
        return res;
    }
}

primeFunctions.isMersennePrime = (val) => {
    if (!primeFunctions.isPrime(val))
        return false;
    else {
        let m = val + 1;
        while (m % 2 === 0) m /= 2;
        return m === 1;
    }
}

primeFunctions.nthMersennePrime = (val) => { // 1 is first
    if (val < 1) return false;
    let counter = 0;
    let i = 1;
    while (true) {
        let curr = Math.pow(2, i) - 1;
        if (primeFunctions.isPrime(curr)) {
            counter += 1;
            if (counter === val) return curr;
        }
        i += 1;
    }
}

primeFunctions.nthMersennePrimeExponents = (val) => {
    let mersenne = primeFunctions.nthMersennePrime(val);
    if (mersenne === false) return false;
    return Math.round(Math.log2(mersenne + 1));
}

primeFunctions.isPrimeOrDivisors = (val) => {
    if (primeFunctions.isPrime(val))
        return true;
    else
        return primeFunctions.primeDivisors(val);
}

primeFunctions.primesSmallerThan = (val) => {
    let res = [];
    for (let i = 2; i < val; i++) {
        if (primeFunctions.isPrime(i)) res.push(i);
    }
    return res;
}

primeFunctions.closestPrime = (val) => {
    let bigger = false;
    let smaller = false;
    for (let i = val + 1; i < Math.pow(val, 3); i++) {
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
    if (res < minVal) res = primeFunctions.primeBiggerThan(minVal - 1);
    if (res > maxVal) res = primeFunctions.primeSmallerThan(maxVal + 1);
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
    let res = [];
    let current = primeFunctions.primeBiggerThan(start);
    while (current < finish) {
        res.push(current);
        current = primeFunctions.nextPrime(current);
    }
    return res;
}

primeFunctions.firstNPrimes = (n) => {
    if (n <= 0)
        return false;
    else {
        let primes = [];
        let next = 2;
        for (let i = 1; i <= n; i++) {
            primes.push(next);
            next = primeFunctions.nextPrime(next);
        }
        return primes;
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

primeFunctions.phi = (n) => {
    let result = n;
    for (let p = 2; p * p <= n; p++) {
        if (n % p == 0) {
            while (n % p == 0) {
                n = parseInt(n) / p;
            }
            result -= parseInt(result) / p;
        }
    }
    if (n > 1)
        result -= parseInt(result) / n;
    return result;
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
