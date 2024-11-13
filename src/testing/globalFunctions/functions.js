export function changeValue(fn, index) {
    const value = Math.random();
    fn(index, value);
}
