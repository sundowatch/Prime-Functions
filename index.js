let start = new Date();
let simulateTime = 5;

exports.printExecutionTime = () => {
    setTimeout(function (argument) {
        let end = new Date() - start;
        console.info('Execution time: %dms', end)
    }, simulateTime)
}

exports.isPrime = (val) => {
    if (val == 1)
        return false;
    else if (val == 2)
        return true;
    else if (val % 2 == 0)
        return false;
    else if (val > 3 && val % 3 == 0 || val > 5 && val % 5 == 0 || val > 7 && val % 7 == 0 || val > 11 && val % 11 == 0 || val > 13 && val % 13 == 0 || val > 17 && val % 17 == 0 || val > 19 && val % 19 == 0)
        return false;
    else {
        let res = true;
        for (var i = 3; i <= Math.round(Math.sqrt(val)); i += 2) {
            if (val % i == 0) {
                res = false;
                break;
            }
        }
        return res;
    }
}

exports.isPrimeOld = (val) => {
    res = true;
    for (let i = 2; i < val; i++) {
        if (val % i == 0) {
            res = false;
            break;
        }
    }
    return res;
}

exports.nthPrime = (val, maxIterator = 99999999999) => {
    let counter = 1;
    if (val == 1) {
        return 2;
    } else {
        var res = false;
        for (var i = 3; i <= maxIterator; i += 2) {
            if (this.isPrime(i)) {
                counter += 1;
                if (counter == val) {
                    res = i;
                    break;
                }
            }
        }
        return res;
    }
}

exports.indexOfPrime = (val) => { // 0 is first index
    if (!this.isPrime(val))
        return false;
    else {
        var i = 1;
        var res;
        while (true) {
            if (this.nthPrime(i) == val) {
                res = i;
                break;
            }
            i++;
        }
        return res - 1;
    }
}

exports.nthPrimesSum = (...args) => {
    var sum = 0;
    for (var i = 0; i < args.length; i++) {
        sum += this.nthPrime(args[i]);
    }
    return sum;
}

exports.nthPrimesTimes = (...args) => {
    var times = 1;
    for (var i = 0; i < args.length; i++) {
        times *= this.nthPrime(args[i]);
    }
    return times;
}

exports.nextPrime = (val) => {
    if (!this.isPrime(val))
        return false;
    else {
        var counter = 1;
        var stopCounter;
        while (1 == 1) {
            var currPrime = this.nthPrime(counter);
            if (currPrime == val) {
                stopCounter = counter;
                break;
            } else
                counter += 1;
        }
        return this.nthPrime(stopCounter + 1);
    }
}

exports.prevPrime = (val) => {
    if (!this.isPrime(val) || val == 2)
        return false;
    else {
        var counter = 1;
        var stopCounter;
        while (1 == 1) {
            var currPrime = this.nthPrime(counter);
            if (currPrime == val) {
                stopCounter = counter;
                break;
            } else
                counter += 1;
        }
        return this.nthPrime(stopCounter - 1);
    }
}

exports.primeSmallerThan = (val) => {
    if (this.isPrime(val)) {
        return this.prevPrime(val);
    } else {
        var i = 1;
        var res;
        while (1 == 1) {
            if (val < this.nthPrime(i + 1) && val > this.nthPrime(i)) {
                res = this.nthPrime(i);
                break;
            }
            i += 1;
        }
        return res;
    }
}

exports.primeBiggerThan = (val) => {
    if (this.isPrime(val))
        return this.nextPrime(val);
    else {
        var i = 1;
        var res;
        while (1 == 1) {
            if (val > this.nthPrime(i) && val < this.nthPrime(i + 1)) {
                res = this.nthPrime(i + 1);
                break;
            }
            i += 1;
        }
        return res;
    }
}

exports.primeDivisors = (val) => {
    if (this.isPrime(val))
        return false; //Prime
    else {
        var arr = [];
        if (val % 2 == 0)
            arr.push(2);
        for (var i = 3; i < val; i += 2) {
            if (this.isPrime(i) && val % i == 0)
                arr.push(i);
        }
        return arr;
    }
}

exports.primeDivisorsSum = (val) => {
    if (this.isPrime(val))
        return false;
    else {
        var pD = this.primeDivisors(val);
        var res = 0;
        for (let i = 0; i < pD.length; i++) {
            res += pD[i];
        }
        return res;
    }
}

exports.primeDivisorsTimes = (val) => {
    if (this.isPrime(val))
        return false;
    else {
        var pD = this.primeDivisors(val);
        var res = 1;
        for (let i = 0; i < pD.length; i++) {
            res *= pD[i];
        }
        return res;
    }
}

exports.isMersennePrime = (val) => {
    if (!this.isPrime(val))
        return false;
    else {
        val = val + 1;
        let primeDiv = this.primeDivisors(val);
        if (primeDiv.length == 1 && primeDiv[0] === 2)
            return true;
        else
            return false;
    }
}

exports.nthMersennePrime = (val, maxIterator = 99999999999) => { // 0 is first
    let counter = 0;
    let res = false;
    for (let i = 1; i < maxIterator; i++) {
        let curr = Math.pow(2, i) - 1;
        if (this.isPrime(curr)) {
            counter += 1;
            if (counter == val) {
                res = curr;
                break;
            }
        }

    }
    return res;
}

exports.nthMersennePrimeExponents = (val, maxIterator = 99999999999) => {
    let mersenne = this.nthMersennePrime(val, maxIterator);
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

exports.isPrimeOrDivisors = (val) => {
    if (this.isPrime(val))
        return true;
    else
        return this.primeDivisors(val);
}

exports.primesSmallerThan = (val) => {
    var i = 1;
    var res = [];
    while (1 == 1) {
        res.push(this.nthPrime(i));
        if (val < this.nthPrime(i + 1) && val > this.nthPrime(i)) {
            break;
        }
        i += 1;
    }
    return res;
}

exports.closestPrime = (val) => {
    let bigger = false;
    let smaller = false;
    for (let i = val + 1; i < Math.pow(val, 3); i++) {
        if (this.isPrime(i)) {
            bigger = i;
            break;
        }
    }
    for (let j = val - 1; j > 1; j--) {
        if (this.isPrime(j)) {
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

exports.randomPrime = (minVal = 2, maxVal = 9999999999999999) => {
    let rnd = Math.floor(Math.random() * (maxVal - minVal)) + minVal;
    rnd = this.closestPrime(rnd);
    return rnd;
}

exports.randomPrimeDigits = (digit) => {
    let a = "1";
    let b = "9";
    for (let i = 0; i < digit; i++) {
        a += "0";
        b += "9";
    }

    a = parseInt(a);
    b = parseInt(b);
    let prime = this.randomPrime(a, b);
    return prime;

}

exports.whatWillThisPrimeBe = (val) => {
    if (this.isPrime(val)) {
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

exports.nextNPrimes = (minVal, n) => {
    let primes = [];
    let it;
    for (var i = 0; i < n; i++) {
        if (i == 0) {
            it = this.primeBiggerThan(minVal);
        } else {
            it = this.nextPrime(it);
        }
        primes.push(it);
    }
    return primes;
}

exports.prevNPrimes = (maxVal, n) => {
    let primes = [];
    let it;
    for (var i = n; i > 0; i--) {
        if (i == n) {
            it = this.primeSmallerThan(maxVal);
        } else {
            it = this.prevPrime(it);
        }
        primes.push(it);
    }
    return primes;
}

exports.primesBetween = (p1, p2) => {
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
        let first = this.primeBiggerThan(start);
        res.push(first);
        let contin = true;
        while (contin) {
            first = this.nextPrime(first);
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

exports.firstNPrimes = (n) => {
    if (n <= 0)
        return false;
    else {
        let primes = [];
        let next = 2;
        for (i = 1; i <= n; i++) {
            primes.push(next);
            next = this.nextPrime(next);
        }
        return primes;
    }
}

exports.digits = (val) => {
    return String(val).length;
}

exports.sum = (arr) => {
    let res = 0;
    for (let i = 0; i < arr.length; i++) {
        res += arr[i];
    }
    return res;
}

exports.times = (arr) => {
    let res = 1;
    for (let i = 0; i < arr.length; i++) {
        res *= arr[i];
    }
    return res;
}

exports.remainDividedBy = (number, division) => {
    return number % division;
}

exports.beautifyInteger = (number) => {
    let len = this.digits(number);
    let str = String(number).split('');
    str = str.reverse();
    let res = '';
    for (let i = 0; i < str.length; i++) {
        res += str[i];
        if( (i+1) % 3 == 0 && i != str.length - 1){
            res += '.';
        }
            
    }
    res = res.split('');
    res = res.reverse();
    res = res.join('');
    return res;
}

exports.integerToText = (integer, language='en') => {
    let alph;
    if(language == 'en')
        alph = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    else if(language == 'tr')
        alph = ['a','b','c','ç','d','e','f','g','ğ','h','ı','i','j','k','l','m','n','o','ö','p','r','s','ş','t','u','ü', 'v', 'y', 'z'];
    integer = String(integer).split('');

    let res = '';
    for (let i = 0; i < integer.length; i++) {
        res += alph[parseInt(integer[i])];
    }
    return res;
}

exports.isEmirp = (number) => {
    let reverse = String(number).split('');
    reverse = reverse.reverse();
    reverse = parseInt(reverse.join(''));
    if(this.isPrime(number) && this.isPrime(reverse))
        return true;
    else
        return false;
}

exports.nthEmirp = (n) => {
    let stop = true;
    let i = 11;
    let counter = 0;
    let res;
    while(stop){
        if(this.isEmirp(i)){
            counter += 1;
            if(counter == n){
                res = i;
                stop = false;
                break;
            }
            
        }
        i += 2;
    }
    return res;
}

exports.hasTwinPrime = (prime, returnItsTwin=true) => {
    if(!this.isPrime(prime))
        return false;
    else if(this.isPrime(prime-2) || this.isPrime(prime+2)){
        if(returnItsTwin){
            if(this.isPrime(prime-2) && this.isPrime(prime+2))
                return [prime-2, prime+2];
            else if(this.isPrime(prime-2))
                return prime-2;
            else
                return prime+2;
        }
        else
            return true;
    }
    else
        return false;
}

exports.factorial = (number) => {
    let res = 1;
    for(let i = number; i > 1; i--){
        res *= i;
    }
    return res;
}

exports.wilsonsTheorem = (n, returnWithExplanation=true) => {
    let res = '';
    let res2;
    if(this.isPrime(n+1) && this.factorial(n) % (n+1) === n){
        res2 = (( this.factorial(n) % (n+1) ) / n ) * (n-1) + 2;
    }
    else
        res2 = false;
    if(returnWithExplanation){
        res += "FORMULA: f(n) = ( " + n + "! mod("+n+"+1) / n ) * ( "+n+"+1 ) + 2 ";
        res += " --- CONDITIONS: if " + n + "+1 is prime if and only if " + n + "! mod("+n+"+1) = " + n + " ";
        return {
            formula: res,
            result: res2
        }
    }
    else{
        return res2;
    }  
}

exports.phi = exports.totient = (n) => {
    let result = n;
    for(let p = 2; p*p <= n; p++){
        if(n % p == 0){
            while(n % p == 0){
                n = parseInt(n) / p;
            }
            result -= parseInt(result) / p;
        }
    }
    if(n > 1)
        result -= parseInt(result) / n;
    return result;
}

exports.integerToString = (number) => {
    return String(number);
}

exports.integerToArray = (number) => {
    let arr = String(number).split('');
    for(let i = 0; i < arr.length; i++){
        arr[i] = parseInt(arr[i]);
    }
    return arr;
}

exports.firstNDigits = (number, n, returnAsInteger=true) => {
    let res = this.integerToArray(number);
    if(returnAsInteger)
        return parseInt(res.slice(0, n).join(''));
    else
        return res.slice(0, n).join('');
}

exports.lastNDigits = (number, n, returnAsInteger=true) => {
    let res = this.integerToArray(number);
    if(returnAsInteger)
        return parseInt(res.slice(res.length - n, res.length).join(''));
    else
        return res.slice(res.length - n,  res.length).join('');
}

exports.reverseNumber = (number) => {
    let res = this.integerToArray(number);
    res = res.reverse();
    res = res.join('');
    return parseInt(res);
}

exports.isTruncatable = (prime) => {
    if(!this.isPrime(prime)){
        return false;
    } else if(prime == 2 || prime == 3 || prime == 5 || prime == 7){
        return false;
    } else{
        let res = true;
        for(let i = 1; i <= this.digits(prime); i++){
            if(!this.isPrime( this.firstNDigits(prime, i) )){
                res = false;
                break;
            }
        }
        if(res){
            for(let i = 1; i <= this.digits(prime); i++){
                let rev = this.lastNDigits(prime, i);
                if(!this.isPrime( rev )){
                    res = false;
                    break;
                }
            }
        }
        return res;
    }
}

exports.truncatableValues = (prime) => {
    if(this.isTruncatable(prime)){
        let res = {
            leftToRight : [],
            rightToLeft : []
        };
        for(let i = 1; i <= this.digits(prime); i++){
            if(this.isPrime( this.firstNDigits(prime, i) )){
               res.leftToRight.push(this.firstNDigits(prime, i)); 
            }
        }
        for(let i = 1; i <= this.digits(prime); i++){
            let rev = this.lastNDigits(prime, i);
            if(this.isPrime( rev )){
                res.rightToLeft.push(rev);
            }
        }
        return res;
    } else
        return false;
}

exports.nthTruncatablePrime = (n) => {
    let counter = 0;
    let primeCounter = 1;
    let res;
    while(counter != n){
        if(this.isTruncatable(this.nthPrime(primeCounter))){
            counter += 1;
            if(counter == n){
                res = this.nthPrime(primeCounter);
                break;
            }
        }
        primeCounter+=1;
    }
    return res;
}

exports.isPandigitalPrime = (number) => {
    if(!this.isPrime(number))
        return false;
    else{
        let numArr = this.integerToArray(number);
        let res = true;
        for(let i = 0; i < numArr.length; i++){
            let newArr = numArr.splice(i, 1);
            if(newArr.indexOf(numArr[i]) != -1){
                res = false;
                break;
            }
        }
        return res;
    }
}