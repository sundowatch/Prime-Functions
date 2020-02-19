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
- Main Functions
    - [isPrime](#isprimenumber)
    - [nthPrime](#nthprimeorder)
    - [indexOfPrime](#indexofprimeprimenumber)
    - [nthPrimesSum](#nthprimessumarguments)
    - [nthPrimesTimes](#nthprimestimesarguments)
    - [nextPrime](#nextprimecurrentprime)
    - [prevPrime](#prevprimecurrentprime)
    - [primeSmallerThan](#primesmallerthannumber)
    - [primeBiggerThan](#primebiggerthannumber)
    - [primeDivisors](#primedivisorsnonprimenumber)
    - [primeDivisorsSum](#primedivisorssumnonprimenumber)
    - [primeDivisorsTimes](#primedivisorstimesnonprimenumber)
    - [isPrimeOrDivisors](#isprimeordivisorsnumber)
    - [primesSmallerThan](#closestprimenumber)
    - [closestPrime](#isprimenumber)
    - [randomPrime](#randomprimeminval-maxval)
    - [whatWillThisPrimeBe](#whatwillthisprimebeprimenumber)
    - [nextNPrimes](#nextnprimesminval-n)
    - [prevNPrimes](#prevnprimesnumber)
    - [primesBetween](#primesbetweennumber1-number2)
    - [firstNPrimes](#firstnprimescount)
    - [isEmirp](#isemirpnumber)
    - [nthEmirp](#nthemirpnumber)
    - [hasTwinPrime](#hastwinprimenumber-returnitstwintrue)
    - [isTruncatable](#isTruncatablenumber)
    - [truncatableValues](#truncatablevaluesnumber)
    - [nthTruncatablePrime](#nthtruncatableprimen)
    - [isPandigitalPrime](#ispandigitalprimen)
- Theoretical Functions
    - [isMersennePrime](#ismersenneprimeprimenumber)
    - [nthMersennePrime](#nthmersenneprimeorder)
    - [nthMersennePrimeExponents](#nthmersenneprimeexponentsorder)
    - [wilsonsTheorem](#wilsonstheoremn-returnwithexplanationtrue)
    - [phi](#phin)
- Helper Functions
    - [digits](#digitsnumber)
    - [sum](#sumnumbersarray)
    - [times](#timesnumbersarray)
    - [remainDividedBy](#remaindividedbynumber-divisor)
    - [printExecutionTime](#printexecutiontime)
    - [beautifyInteger](#beautifyinteger)
    - [integertotext](#integertotext)
    - [factorial](#factorialnumber)
    - [integerToString](#integertostringnumber)
    - [integerToArray](#integertoarraynumber)
    - [firstNDigits](#firstndigitsnumber-n-returnasintegertrue)
    - [lastNDigits](#lastndigitsnumber-n-returnasintegertrue)
    - [reverseNumber](#reversenumbernumber)


#### isPrime(number)
Return if a number is [Prime Number](https://en.wikipedia.org/wiki/Prime_number)
```javascript
let result = pr.isPrime(13);    // true
```
```javascript
let result = pr.isPrime(28);    // false
```
#### nthPrime(order)
Get nth prime
```javascript
let result = pr.nthPrime(5);    // 11
```
#### indexOfPrime(primeNumber)
Get index of prime number
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
Checks if a prime is a [Mersenne Prime](https://en.wikipedia.org/wiki/Mersenne_prime)
```javascript
let result = pr.isMersennePrime(127);    // true
```
#### nthMersennePrime(order)
Get nth [Mersenne Prime](https://en.wikipedia.org/wiki/Mersenne_prime)
```javascript
let result = pr.nthMersennePrime(5);    // 8191
```
#### nthMersennePrimeExponents(order)
Get nth [Mersenne Prime](https://en.wikipedia.org/wiki/Mersenne_prime)'s exponents
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

#### reverseNumber(number)
helper function
```javascript
pr.reverseNumber(123456);    // 654321
```

#### integerToText()
helper function
```javascript
pr.integerToText(1234567890);    // bcdefghija
```

#### integerToString(number)
helper function
```javascript
pr.integerToString(1234567890);    // '1234567890'
```

#### integerToArray(number)
helper function
```javascript
pr.integerToArray(1234567890);    // ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
```

#### firstNDigits(number, n, returnAsInteger=true)
helper function

Returns number first n digits
```javascript
pr.firstNDigits(1234567890, 4);    // 1234
```

#### lastNDigits(number, n, returnAsInteger=true)
helper function

Returns number last n digits
```javascript
pr.lastNDigits(1234567890, 4);    // 7890
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
pr.nthEmirp(2);    // 13
pr.nthEmirp(5);    // 37
```

#### hasTwinPrime(number, returnItsTwin=true)
check if the prime has a twin
```javascript
pr.hasTwinPrime(3);    // 5
pr.hasTwinPrime(5);    // [5, 7]
pr.hasTwinPrime(311);   // 313
pr.hasTwinPrime(3, false);   // True
pr.hasTwinPrime(37);    // false
```

#### factorial(number)
helper
```javascript
pr.factorial(3);    // 6
pr.factorial(pr.factorial(3));    // 720
```

#### wilsonsTheorem(n, returnWithExplanation=true)
The [Wilson's Theorem](https://en.wikipedia.org/wiki/Wilson%27s_theorem). 

n+1 should be prime number if and only if n! mod(n+1) = n.

returnWithExplanation is the conditions and explanation of Wilson's Theorem.
```javascript
pr.wilsonsTheorem(6);
/*
{
  formula: 'FORMULA: f(n) = ( 6! mod(6+1) / n ) * ( 6+1 ) + 2  --- CONDITIONS: if 6+1 is prime if and only if 6! mod(6+1) = 6 ',
  result: 7
}
*/

pr.wilsonsTheorem(6, false);    // 7
```

#### phi(n)
Euler's [phi](https://en.wikipedia.org/wiki/Euler%27s_totient_function) and also known as [totient](https://en.wikipedia.org/wiki/Euler%27s_totient_function) function. 

Function can be used as both phi and totient

```javascript
pr.totient(1)   // 1
pr.phi(2)       // 1
pr.phi(3)       // 2
pr.phi(4)       // 2
pr.totient(5)   // 4
pr.phi(6)       // 2
pr.phi(7)       // 6
pr.totient(8)   // 4
pr.phi(9)       // 6
pr.phi(10)      // 4
```

#### isTruncatable(number)
Check if the given number is [Truncatable Prime](https://en.wikipedia.org/wiki/Truncatable_prime)

```javascript
pr.isTruncatable(3797); //true
pr.isTruncatable(373);  //true
pr.isTruncatable(23);   //false
```

#### truncatableValues(number)
Returns number's [Truncatable](https://en.wikipedia.org/wiki/Truncatable_prime) values

```javascript
pr.truncatableValues(3797);
/*
{
  leftToRight: [ 3, 37, 379, 3797 ],
  rightToLeft: [ 7, 97, 797, 3797 ]
}
*/
```

#### nthTruncatablePrime(n)
Finds the nth [Truncatable Prime](https://en.wikipedia.org/wiki/Truncatable_prime)

```javascript
pr.nthTruncatablePrime(10);   // 3797
```

#### isPanditalPrime(n)
Checks if the given number is [Pandigital Prime](https://oeis.org/wiki/Pandigital_numbers)

```javascript
pr.isPandigitalPrime(2143);   // true
```

