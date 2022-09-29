(function () {
  const sizes = new Map();
  let total = 0;
  let reallocs = 0;

  function onAlloc(size, align, pointer) {
    const n = sizes.get(size) || 0;
    sizes.set(size, n + 1);
    total += size;
  }

  function onDealloc(size, align, pointer) {
  }

  function onAllocZeroed(size, align, pointer) {
    onAlloc(size, align, pointer);
  }

  function onRealloc(
    oldPointer,
    newPointer,
    oldSize,
    newSize,
    align,
  ) {
    onDealloc(oldSize, align, oldPointer);
    onAlloc(newSize, align, newPointer);
    reallocs += 1;
  }

  function dumpTable(entries, { keyLabel, valueLabel, totalLabel, getKey, getValue }) {
    const byKey = new Map;
    let total = 0;
    let grandTotal = 0;

    for (const entry of entries) {
      const key = getKey(entry);
      const keyValue = byKey.get(key) || 0;
      const entryValue = getValue(entry);
      total += key;
      grandTotal += key * entryValue;
      byKey.set(key, keyValue + entryValue);
    }

    const table = [...byKey]
          .sort((a, b) => b[1] - a[1])
          .map(a => ({ [keyLabel]: a[0], [valueLabel]: a[1], [totalLabel]: a[0] * a[1] }));

    table.unshift({ [keyLabel]: "<total>", [valueLabel]: total, [totalLabel]: grandTotal  });

    console.table(table, [keyLabel, valueLabel, totalLabel]);
  }

  function getGlobal() {
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
  }

  getGlobal().WasmTracingAllocator = {
    on_alloc: onAlloc,
    on_dealloc: onDealloc,
    on_alloc_zeroed: onAllocZeroed,
    on_realloc: onRealloc,

    dumpAllocations(opts) {
      console.log("Total allocated:", total);
      console.log("Number of reallocations:", reallocs);
      dumpTable(sizes.entries(), Object.assign({
        keyLabel: "Size (Bytes)",
        valueLabel: "Number",
        totalLabel: "Total (Bytes)",
        getKey: ([key, value]) => key,
        getValue: ([key, value]) => value,
      }, opts));
    },

  };
}());
