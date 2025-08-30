// Test file for cognitive complexity
function complexExample(items, options) {
  if (!items || !items.length) return [];  // +2 (|| operator)
  
  const results = [];
  
  for (let item of items) {                 // +1
    if (item.valid) {                      // +2 (nested)
      if (options && options.filter) {     // +3 (nested +2, && +1)
        switch (item.type) {               // +3 (nested +2, switch +1)
          case 'A':
            results.push(processA(item));
            break;
          case 'B':
            if (item.special) {            // +4 (nested +3, if +1)
              results.push(processB(item, true));
            }
            break;
        }
      } else {
        results.push(item);
      }
    }
  }
  
  return results;
}

function simpleExample(x) {
  if (x > 0) {    // +1
    return x * 2;
  }
  return 0;
}