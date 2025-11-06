export const getBits = (value: number, start: number, end: number) => {
  if (value < 0 || value > 0xffffffff) {
    throw new Error("Value must be a valid 32-bit unsigned integer");
  }
  if (start < 0 || end > 31) {
    throw new Error("Start and end indices must be between 0 and 31");
  }
  if (start > end) {
    throw new Error("Start index must be less than end index");
  }

  const numberOfBits = end - start + 1;
  const shiftedValue = value >> start;

  if (numberOfBits === 32) {
    return shiftedValue >>> 0;
  }
  return shiftedValue & ((1 << numberOfBits) - 1);
};

const MAX_VALUES = [
  0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767,
  65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215,
  33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647,
  0xffffffff,
];

export const setBits = (
  value: number,
  start: number,
  end: number,
  newBits: number
) => {
  if (value < 0 || value > 0xffffffff || newBits < 0) {
    throw new Error("Values must be valid 32-bit unsigned integers");
  }
  if (start < 0 || end > 31 || start > end) {
    throw new Error(
      "Start and end indices must be between 0 and 31, start <= end"
    );
  }

  const numberOfBits = end - start + 1;
  if (newBits > MAX_VALUES[numberOfBits]) {
    throw new Error(`Write value must fit in ${numberOfBits} bits`);
  }

  if (numberOfBits === 32) {
    return newBits;
  }

  const bitMask = MAX_VALUES[numberOfBits];
  const mask = ~(bitMask << start);
  const clearedValue = value & mask;
  const shiftedWriteValue = newBits << start;

  return clearedValue | shiftedWriteValue;
};
