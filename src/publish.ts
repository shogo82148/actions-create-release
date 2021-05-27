import * as core from '@actions/core'
import * as release from './publish-release'

async function run(): Promise<void> {
  try {
    await release.publish({})
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
