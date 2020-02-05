# Prime Functions (Useful Prime Numbers Functions)

![](https://dev.truncgil.com/prime-logo-180x180.png)

Primes are of the utmost importance to number theorists because they are the building blocks of whole numbers, and important to the world because their odd mathematical properties make them perfect for our current uses.
On that matter we've built a library to create and find prime numbers

### Features

- Basic prime number generators
- Primes' indexes
- High performance
- Some special prime arrays
- Relations with normal integers

## Installation
<pre>npm install prime-functions</pre>
## Usage

```javascript
const pr = require('prime-functions');
```

## Functions
#### isPrime(number)
```javascript
let result = pr.isPrime(13);    // true
```
```javascript
let result = pr.isPrime(28);    // false
```
#### nthPrime(order)
```javascript
let result = pr.nthPrime(5);    // 11
```
#### indexOfPrime(primeNumber)
```javascript
let result = pr.indexOfPrime(13);    // 5
```
Index starts from 0
#### nthPrimesSum(...arguments)
```javascript
let result = pr.nthPrimesSum(3,5,7);    // 5 + 11 + 17 = 33
```
#### nthPrimesTimes(...arguments)
```javascript
let result = pr.nthPrimesTimes(3,5,7);    // 5 * 11 * 17 = 935
```
#### nextPrime(currentPrime)
```javascript
let result = pr.nextPrime(17);    // 19
```
#### prevPrime(currentPrime)
```javascript
let result = pr.prevPrime(17);    // 13
```
#### primeSmallerThan(number)
```javascript
let result = pr.primeSmallerThan(100);    // 97
```
#### primeBiggerThan(number)
```javascript
let result = pr.primeBiggerThan(100);    // 101
```
#### primeDivisors(nonPrimeNumber)
```javascript
let result = pr.primeDivisors(42);    // [2,3,7]
```
#### primeDivisorsSum(nonPrimeNumber)
```javascript
let result = pr.primeDivisorsSum(42);    // 2 + 3 + 7 = 12
```
#### primeDivisorsTimes(nonPrimeNumber)
```javascript
let result = pr.primeDivisorsTimes(42);    // 2 * 3 * 7 = 42
```
#### isMersennePrime(primeNumber)
```javascript
let result = pr.isMersennePrime(127);    // true
```
#### nthMersennePrime(order)
```javascript
let result = pr.nthMersennePrime(5);    // 8191
```
#### nthMersennePrimeExponents(order)
```javascript
let result = pr.nthMersennePrimeExponents(5);    // 13  - That means 2^13
```
#### isPrimeOrDivisors(number)
If the number is prime it returns true, otherwise it returns prime divisors
#### primesSmallerThan(number)
```javascript
let result = pr.primesSmallerThan(25);    // [ 2, 3, 5, 7, 11, 13, 17, 19, 23 ]
```
#### closestPrime(number)
```javascript
let result = pr.closestPrime(25);    // 23
```
#### randomPrime(minVal, maxVal)
```javascript
let result = pr.randomPrime(25, 48);    // 31
```
#### whatWillThisPrimeBe(primeNumber)
```javascript
let result = pr.whatWillThisPrimeBe(23);    // It'll strengthen you
```
#### nextNPrimes(minVal, n)
```javascript
let result = pr.nextNPrimes(25, 5);    // [ 29, 31, 37, 41, 43 ]
```
#### prevNPrimes(number)
```javascript
let result = pr.prevNPrimes(25, 5);    // [ 23, 19, 17, 13, 11 ]
```
#### primesBetween(number1, number2)
```javascript
let result = pr.primesBetween(80, 150);    // [ 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149 ]
```
#### firstNPrimes(count)
```javascript
let result = pr.firstNPrimes(7);    // [ 2, 3, 5, 7, 11, 13, 17 ]
```
#### digits(number)
helper function
```javascript
let result = pr.digits(1554);    // 4
```
#### sum(numbersArray)
helper function
```javascript
let result = pr.sum([2,3,4]);    // 9
```
#### times(numbersArray)
helper function
```javascript
let result = pr.times([2,3,4]);    // 24
```
#### remainDividedBy(number, divisor)
helper function
```javascript
let result = pr.remainDividedBy(8,3);    // 2
```
#### printExecutionTime()
helper function
That should be bottom of the script
```javascript
pr.printExecutionTime();    // Execution time: 119ms
```

#### beautifyInteger()
helper function
```javascript
pr.beautifyInteger(123123123);    // 123.123.123
```

#### integerToText()
helper function
```javascript
pr.integerToText(1234567890);    // bcdefghija
```

#### isEmirp(number)
returns if the given number is emirp.
```javascript
pr.isEmirp(13);    // true
pr.isEmirp(31);    // true
pr.isEmirp(19);    // false
```

#### nthEmirp(number)
returns nth emirp. 1 is the 11 
```javascript
pr.isEmirp(2);    // 13
pr.isEmirp(5);    // 37
```