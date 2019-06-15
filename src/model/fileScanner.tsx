
/* 
https://blog.logrocket.com/node-js-multithreading-what-are-worker-threads-and-why-do-they-matter-48ab102f8b10/
// main app
const workerFarm = require('worker-farm')
const service = workerFarm(require.resolve('./script'))
 
service('hello', function (err, output) {
  console.log(output)
})

// script.js
// This will run in forked processes
module.exports = (input, callback) => {
  callback(null, input + ' ' + world)
}
*/

const { workerData, parentPort } = require('worker_threads')

var num:number = 5; 
var factorial:number = 1; 

while(num >=1) { 
   factorial = factorial * num; 
   num--; 
} 
console.log("The factorial  is "+factorial);  
parentPort.postMessage({ hello: workerData })


class Scanner extends ServiceWorker {
   
}
export default Scanner