import * as release from '../src/publish-release'

test('Create a new release', async () => {
  const updateRelease = jest.fn().mockReturnValue({
    id: 123,
    html_url: 'http://example.com/html',
    upload_url: 'http://example.com/upload'
  })

  await release.publish({
    id: '123',
    github_token: 'very-secret',
    owner: 'shogo82148',
    repo: 'github-action-test',
    updateRelease: updateRelease
  })
  expect(updateRelease).toBeCalledTimes(1)
  expect(updateRelease).toHaveBeenCalledWith({
    id: '123',
    github_token: 'very-secret',
    owner: 'shogo82148',
    repo: 'github-action-test',
    draft: false
  })
})
