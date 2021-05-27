import * as core from '@actions/core'
import * as release from './create-release'

async function run(): Promise<void> {
  try {
    await release.create({})
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
