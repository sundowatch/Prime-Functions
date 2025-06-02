let primeFunctions = {};

let start = new Date();
primeFunctions.simulateTime = 5;
primeFunctions.printExecutionTime = () => {
    setTimeout(function (argument) {
        let end = new Date() - start;
        console.info('Execution time: %dms', end)
    }, primeFunctions.simulateTime)
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
        if (value < 0n) throw "negative input";
        if (value < 2n) return value;
        let x = value;
        let y = (x + 1n) / 2n;
        while (y < x) {
            x = y;
            y = (x + value / x) / 2n;
        }
        return x;
    }

    // Fast modular exponentiation for both Number and BigInt
    function modPow(base, exp, mod) {
        let res = (typeof base === 'bigint') ? 1n : 1;
        while (exp > 0) {
            if (exp % 2 === 1 || exp % 2n === 1n) res = (res * base) % mod;
            exp = (typeof exp === 'bigint') ? exp / 2n : Math.floor(exp / 2);
            base = (base * base) % mod;
        }
        return res;
    }

    // Helper to get deterministic bases for Miller-Rabin (valid for n < 2^64)
    function getDeterministicBases(n) {
        if (typeof n === 'bigint' ? n < 341550071728321n : n < 341550071728321) {
            // https://miller-rabin.appspot.com/ and OEIS
            return [2, 3, 5, 7, 11, 13, 17];
        }
        // For even larger n < 2^64
        if (typeof n === 'bigint' ? n < 18446744073709551616n : n < 18446744073709551616) {
            return [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
        }
        return null; // should use probabilistic for larger n
    }

    // Miller-Rabin primality test, Number or BigInt
    function millerRabinTest(n, rounds) {
        const isBig = (typeof n === 'bigint');
        const one = isBig ? 1n : 1, two = isBig ? 2n : 2, three = isBig ? 3n : 3;
        if (n < two) return false;
        if (n === two || n === three) return true;
        if (n % two === 0) return false;

        // Try deterministic for n < 2^64
        const bases = getDeterministicBases(n);
        let roundBases = bases;
        if (!bases) {
            // Large n: Use random bases between [2, n-2] (as BigInt or Number)
            roundBases = [];
            for (let i = 0; i < rounds; i++) {
                if (isBig) {
                    // Secure random BigInt base between 2 and n-2
                    let bStr = (BigInt("2") + BigInt(Math.floor(Math.random() * Number(n-4n)))).toString();
                    roundBases.push(BigInt(bStr));
                } else {
                    roundBases.push(2 + Math.floor(Math.random() * (n - 3)));
                }
            }
        }
        // Write n-1 as d*2^r
        let d = n - one;
        let r = 0;
        while (d % two === 0) {
            d = d / two;
            r++;
        }
        outer: for (const a of roundBases) {
            let base = isBig ? BigInt(a) : a;
            if (base >= n) continue;
            let x = modPow(base, d, n);
            if (x === one || x === n - one) continue;
            for (let j = 1; j < r; j++) {
                x = modPow(x, two, n);
                if (x === n - one) continue outer;
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
    res = true;
    for (let i = 2; i < val; i++) {
        if (val % i == 0) {
            res = false;
            break;
        }
    }
    return res;
}

primeFunctions.nthPrime = (val) => {
    let counter = 1;
    if (val == 1) {
        return 2;
    } else {
        var res = false;
        let loop = true;
        let i = 3;
        while(loop){
            if (primeFunctions.isPrime(i)) {
                counter += 1;
                if (counter === val) {
                    res = i;
                    loop = false;
                    break;
                }
            }
            i+=2;
        }
        return res;
    }
}

primeFunctions.indexOfPrime = (val) => { // 0 is first index
    if (!primeFunctions.isPrime(val))
        return false;
    else {
        var i = 1;
        var res;
        while (true) {
            if (primeFunctions.nthPrime(i) == val) {
                res = i;
                break;
            }
            i++;
        }
        return res - 1;
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
        var counter = 1;
        var stopCounter;
        while (1 == 1) {
            var currPrime = primeFunctions.nthPrime(counter);
            if (currPrime == val) {
                stopCounter = counter;
                break;
            } else
                counter += 1;
        }
        return primeFunctions.nthPrime(stopCounter + 1);
    }
}

primeFunctions.prevPrime = (val) => {
    if (!primeFunctions.isPrime(val) || val == 2)
        return false;
    else {
        var counter = 1;
        var stopCounter;
        while (1 == 1) {
            var currPrime = primeFunctions.nthPrime(counter);
            if (currPrime == val) {
                stopCounter = counter;
                break;
            } else
                counter += 1;
        }
        return primeFunctions.nthPrime(stopCounter - 1);
    }
}

primeFunctions.primeSmallerThan = (val) => {
    if (primeFunctions.isPrime(val)) {
        return primeFunctions.prevPrime(val);
    } else {
        var i = 1;
        var res;
        while (1 == 1) {
            if (val < primeFunctions.nthPrime(i + 1) && val > primeFunctions.nthPrime(i)) {
                res = primeFunctions.nthPrime(i);
                break;
            }
            i += 1;
        }
        return res;
    }
}

primeFunctions.primeBiggerThan = (val) => {
    if (primeFunctions.isPrime(val))
        return primeFunctions.nextPrime(val);
    else {
        var i = 1;
        var res;
        while (1 == 1) {
            if (val > primeFunctions.nthPrime(i) && val < primeFunctions.nthPrime(i + 1)) {
                res = primeFunctions.nthPrime(i + 1);
                break;
            }
            i += 1;
        }
        return res;
    }
}

primeFunctions.primeDivisors = (val) => {
    if (primeFunctions.isPrime(val))
        return false; //Prime
    else {
        var arr = [];
        if (val % 2 == 0)
            arr.push(2);
        for (var i = 3; i < val; i += 2) {
            if (primeFunctions.isPrime(i) && val % i == 0)
                arr.push(i);
        }
        return arr;
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
        val = val + 1;
        let primeDiv = primeFunctions.primeDivisors(val);
        if (primeDiv.length == 1 && primeDiv[0] === 2)
            return true;
        else
            return false;
    }
}

primeFunctions.nthMersennePrime = (val) => { // 0 is first
    let counter = 0;
    let res = false;
    let loop = true;
    let i = 1;
    while(loop){
        let curr = Math.pow(2, i) - 1;
        if (primeFunctions.isPrime(curr)) {
            counter += 1;
            if (counter == val) {
                res = curr;
                loop = false;
                break;
            }
        }
        i+=1;
    }
    return res;
}

primeFunctions.nthMersennePrimeExponents = (val) => {
    let mersenne = primeFunctions.nthMersennePrime(val);
    mersenne = mersenne + 1;
    let i = 0;
    let stop = false;
    let ret = false;
    while (stop == false) {
        i += 1;
        if (mersenne / 2 == 1) {
            ret = i;
            stop = true;
            break;
        } else {
            mersenne = mersenne / 2;
        }
    }

    return ret;
}

primeFunctions.isPrimeOrDivisors = (val) => {
    if (primeFunctions.isPrime(val))
        return true;
    else
        return primeFunctions.primeDivisors(val);
}

primeFunctions.primesSmallerThan = (val) => {
    var i = 1;
    var res = [];
    while (1 == 1) {
        res.push(primeFunctions.nthPrime(i));
        if (val < primeFunctions.nthPrime(i + 1) && val > primeFunctions.nthPrime(i)) {
            break;
        }
        i += 1;
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

primeFunctions.randomPrime = (minVal = 2, maxVal = 9999999999999999) => {
    let rnd = Math.floor(Math.random() * (maxVal - minVal)) + minVal;
    rnd = primeFunctions.closestPrime(rnd);
    return rnd;
}

primeFunctions.randomPrimeDigits = (digit) => {
    let a = "1";
    let b = "9";
    for (let i = 0; i < digit; i++) {
        a += "0";
        b += "9";
    }

    a = parseInt(a);
    b = parseInt(b);
    let prime = primeFunctions.randomPrime(a, b);
    return prime;

}

primeFunctions.whatWillThisPrimeBe = (val) => {
    if (primeFunctions.isPrime(val)) {
        let arr = [
            "It'll communicate with you",
            "It'll be lucky for you",
            "It'll strengthen you",
            "It'll make you happy"
        ];
        var kal = val % arr.length;
        return arr[kal - 1];
    } else
        return false;
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
    let check = true;
    let start;
    let finish;
    if (p1 > p2) {
        start = p2;
        finish = p1;
    } else if (p2 > p1) {
        start = p1;
        finish = p2;
    } else {
        check = false;
    }
    if (check) {
        let res = [];
        let first = primeFunctions.primeBiggerThan(start);
        res.push(first);
        let contin = true;
        while (contin) {
            first = primeFunctions.nextPrime(first);
            if (first >= finish) {
                contin = false;
                break;
            } else {
                res.push(first);
            }
        }
        return res;
    } else
        return false;
}

primeFunctions.firstNPrimes = (n) => {
    if (n <= 0)
        return false;
    else {
        let primes = [];
        let next = 2;
        for (i = 1; i <= n; i++) {
            primes.push(next);
            next = primeFunctions.nextPrime(next);
        }
        return primes;
    }
}

primeFunctions.digits = (val) => {
    return String(val).length;
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
    let len = primeFunctions.digits(number);
    let str = String(number).split('');
    str = str.reverse();
    let res = '';
    for (let i = 0; i < str.length; i++) {
        res += str[i];
        if ((i + 1) % 3 == 0 && i != str.length - 1) {
            res += '.';
        }

    }
    res = res.split('');
    res = res.reverse();
    res = res.join('');
    return res;
}

primeFunctions.integerToText = (integer, language = 'en') => {
    let alph;
    if (language == 'en')
        alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    else if (language == 'tr')
        alph = ['a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z'];
    integer = String(integer).split('');

    let res = '';
    for (let i = 0; i < integer.length; i++) {
        res += alph[parseInt(integer[i])];
    }
    return res;
}

primeFunctions.isEmirp = (number) => {
    let reverse = String(number).split('');
    reverse = reverse.reverse();
    reverse = parseInt(reverse.join(''));
    if (primeFunctions.isPrime(number) && primeFunctions.isPrime(reverse))
        return true;
    else
        return false;
}

primeFunctions.nthEmirp = (n) => {
    let stop = true;
    let i = 11;
    let counter = 0;
    let res;
    while (stop) {
        if (primeFunctions.isEmirp(i)) {
            counter += 1;
            if (counter == n) {
                res = i;
                stop = false;
                break;
            }

        }
        i += 2;
    }
    return res;
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
    let res = '';
    let res2;
    if (primeFunctions.isPrime(n + 1) && primeFunctions.factorial(n) % (n + 1) === n) {
        res2 = ((primeFunctions.factorial(n) % (n + 1)) / n) * (n - 1) + 2;
    } else
        res2 = false;
    if (returnWithExplanation) {
        res += "FORMULA: f(n) = ( " + n + "! mod(" + n + "+1) / n ) * ( " + n + "+1 ) + 2 ";
        res += " --- CONDITIONS: if " + n + "+1 is prime if and only if " + n + "! mod(" + n + "+1) = " + n + " ";
        return {
            formula: res,
            result: res2
        }
    } else {
        return res2;
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
    let arr = String(number).split('');
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(arr[i]);
    }
    return arr;
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
        let numArr = primeFunctions.integerToArray(number);
        let res = true;
        for (let i = 0; i < numArr.length; i++) {
            let newArr = numArr.splice(i, 1);
            if (newArr.indexOf(numArr[i]) != -1) {
                res = false;
                break;
            }
        }
        return res;
    }
}

//console.log(typeof module);

if (typeof exports !== 'undefined') {
    if(typeof module !== 'undefined' && module.exports){
    module.exports.printExecutionTime = primeFunctions.printExecutionTime;
    module.exports.isPrime = primeFunctions.isPrime;
    module.exports.isPrimeOld = primeFunctions.isPrimeOld;
    module.exports.nthPrime = primeFunctions.nthPrime;
    module.exports.indexOfPrime = primeFunctions.indexOfPrime;
    module.exports.nthPrimesSum = primeFunctions.nthPrimesSum;
    module.exports.nthPrimesTimes = primeFunctions.nthPrimesTimes;
    module.exports.nextPrime = primeFunctions.nextPrime;
    module.exports.prevPrime = primeFunctions.prevPrime;
    module.exports.primeSmallerThan = primeFunctions.primeSmallerThan;
    module.exports.primeBiggerThan = primeFunctions.primeBiggerThan;
    module.exports.primeDivisors = primeFunctions.primeDivisors;
    module.exports.primeDivisorsSum = primeFunctions.primeDivisorsSum;
    module.exports.primeDivisorsTimes = primeFunctions.primeDivisorsTimes;
    module.exports.isMersennePrime = primeFunctions.isMersennePrime;
    module.exports.nthMersennePrime = primeFunctions.nthMersennePrime;
    module.exports.nthMersennePrimeExponents = primeFunctions.nthMersennePrimeExponents;
    module.exports.isPrimeOrDivisors = primeFunctions.isPrimeOrDivisors;
    module.exports.primesSmallerThan = primeFunctions.primesSmallerThan;
    module.exports.closestPrime = primeFunctions.closestPrime;
    module.exports.randomPrime = primeFunctions.randomPrime;
    module.exports.randomPrimeDigits = primeFunctions.randomPrimeDigits;
    module.exports.whatWillThisPrimeBe = primeFunctions.whatWillThisPrimeBe;
    module.exports.nextNPrimes = primeFunctions.nextNPrimes;
    module.exports.prevNPrimes = primeFunctions.prevNPrimes;
    module.exports.primesBetween = primeFunctions.primesBetween;
    module.exports.firstNPrimes = primeFunctions.firstNPrimes;
    module.exports.digits = primeFunctions.digits;
    module.exports.sum = primeFunctions.sum;
    module.exports.times = primeFunctions.times;
    module.exports.remainDividedBy = primeFunctions.remainDividedBy;
    module.exports.beautifyInteger = primeFunctions.beautifyInteger;
    module.exports.integerToText = primeFunctions.integerToText;
    module.exports.isEmirp = primeFunctions.isEmirp;
    module.exports.nthEmirp = primeFunctions.nthEmirp;
    module.exports.hasTwinPrime = primeFunctions.hasTwinPrime;
    module.exports.factorial = primeFunctions.factorial;
    module.exports.wilsonsTheorem = primeFunctions.wilsonsTheorem;
    module.exports.phi = primeFunctions.phi;
    module.exports.totient = primeFunctions.totient;
    module.exports.integerToString = primeFunctions.integerToString;
    module.exports.integerToArray = primeFunctions.integerToArray;
    module.exports.firstNDigits = primeFunctions.firstNDigits;
    module.exports.lastNDigits = primeFunctions.lastNDigits;
    module.exports.reverseNumber = primeFunctions.reverseNumber;
    module.exports.isTruncatable = primeFunctions.isTruncatable;
    module.exports.truncatableValues = primeFunctions.truncatableValues;
    module.exports.nthTruncatablePrime = primeFunctions.nthTruncatablePrime;
    module.exports.isPandigitalPrime = primeFunctions.isPandigitalPrime;
} } else{
    //console.log('browser');  
}