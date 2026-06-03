export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickWithout(arr, exclude) {
  const filtered = arr.filter(x => x !== exclude)
  return pickOne(filtered.length ? filtered : arr)
}
