import { describe, it, expect } from 'vitest'
import { shuffle, pickOne, pickWithout } from '../random.js'

describe('shuffle', () => {
  it('no muta el array original', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    shuffle(arr)
    expect(arr).toEqual(copy)
  })
  it('mantiene los mismos elementos', () => {
    const arr = [1, 2, 3, 4, 5]
    const out = shuffle(arr).sort()
    expect(out).toEqual([1, 2, 3, 4, 5])
  })
})

describe('pickOne', () => {
  it('devuelve un elemento del array', () => {
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 50; i++) expect(arr).toContain(pickOne(arr))
  })
})

describe('pickWithout', () => {
  it('nunca devuelve el excluido si hay alternativas', () => {
    const arr = [1, 2, 3, 4]
    for (let i = 0; i < 50; i++) expect(pickWithout(arr, 3)).not.toBe(3)
  })
  it('si todos están excluidos, devuelve igualmente algo del array', () => {
    const arr = [7]
    expect(pickWithout(arr, 7)).toBe(7)
  })
})
