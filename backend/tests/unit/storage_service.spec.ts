import { test } from '@japa/runner'
import storageService from '#services/storage_service'

test.group('StorageService.urlToKey', () => {
  test('returns null for empty input', ({ assert }) => {
    assert.isNull(storageService.urlToKey(''))
  })

  test('passes through raw keys unchanged (minus leading slash)', ({ assert }) => {
    assert.equal(storageService.urlToKey('profile-photos/abc.jpg'), 'profile-photos/abc.jpg')
    assert.equal(storageService.urlToKey('/profile-photos/abc.jpg'), 'profile-photos/abc.jpg')
  })
})
