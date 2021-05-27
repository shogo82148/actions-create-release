import * as core from '@actions/core'
import * as release from './create-release'

async function run(): Promise<void> {
  try {
    const required = {required: true}
    const tag_name = core.getInput('tag_name', required)
    const release_name = core.getInput('release_name', required)
    const body = core.getInput('body')
    const body_path = core.getInput('body_path')
    const draft = core.getBooleanInput('draft')
    const prerelease = core.getBooleanInput('prerelease')
    const commitish = core.getInput('commitish')
    const owner = core.getInput('owner')
    const repo = core.getInput('repo')
    const result = await release.create({
      tag_name,
      release_name,
      body,
      body_path,
      draft,
      prerelease,
      commitish,
      owner,
      repo
    })
    core.setOutput('id', result.id)
    core.setOutput('html_url', result.html_url)
    core.setOutput('upload_url', result.upload_url)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
