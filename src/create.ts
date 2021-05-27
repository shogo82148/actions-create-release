import * as core from '@actions/core'
import * as release from './create-release'

async function run(): Promise<void> {
  try {
    const required = {required: true}
    const github_token = core.getInput('github_token', required)
    let tag_name = core.getInput('tag_name')
    const release_name = core.getInput('release_name')
    const body = core.getInput('body')
    const body_path = core.getInput('body_path')
    const draft = core.getBooleanInput('draft')
    const prerelease = core.getBooleanInput('prerelease')
    const commitish = core.getInput('commitish')
    const owner = core.getInput('owner')
    const repo = core.getInput('repo')
    if (tag_name === '') {
      const ref = process.env['GITHUB_REF'] || ''
      if (!ref.startsWith('refs/tags/')) {
        throw new Error(`${ref} is not a tag`)
      }
      tag_name = ref.substring('refs/tags/'.length)
    }
    const result = await release.create({
      github_token,
      tag_name,
      release_name,
      body,
      body_path,
      prerelease,
      commitish,
      owner,
      repo,

      // Always create release as draft first.
      // It is to prevent users from seeing empty release.
      draft: true
    })
    core.setOutput('id', result.id)
    core.setOutput('html_url', result.html_url)
    core.setOutput('upload_url', result.upload_url)

    if (!draft) {
      core.saveState('id', result.id)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
