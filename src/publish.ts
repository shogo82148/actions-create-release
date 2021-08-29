import * as core from '@actions/core'
import * as release from './publish-release'

async function run(): Promise<void> {
  try {
    const id = core.getState('id')
    if (id === '') {
      // skip to publish
      return
    }

    const required = {required: true}
    const github_token = core.getInput('github_token', required)
    const owner = core.getInput('owner')
    const repo = core.getInput('repo')

    await release.publish({
      github_token,
      owner,
      repo,
      id
    })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    } else {
      core.setFailed(`${error}`)
    }
  }
}

run()
