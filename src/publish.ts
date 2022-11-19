import * as core from "@actions/core";
import * as release from "./publish-release";

async function run(): Promise<void> {
  try {
    const id = core.getState("id");
    if (id === "") {
      // skip to publish
      return;
    }

    const required = { required: true };
    const github_token = core.getInput("github_token", required);
    const owner = core.getInput("owner");
    const repo = core.getInput("repo");
    const discussion_category_name = core.getInput("discussion_category_name");
    const draft = core.getBooleanInput("draft");
    const prerelease = core.getBooleanInput("prerelease");

    const make_latest_default = !draft && !prerelease ? "true" : "false";
    const make_latest_input = core.getInput("make_latest") || make_latest_default;

    let make_latest: release.MakeLatest;
    switch (make_latest_input) {
      case "true":
      case "false":
      case "legacy":
        make_latest = make_latest_input;
        break;
      default:
        throw new Error(`invalid value for make_latest: ${make_latest_input}`);
    }

    await release.publish({
      github_token,
      owner,
      repo,
      id,
      discussion_category_name,
      make_latest,
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error);
    } else {
      core.setFailed(`${error}`);
    }
  }
}

run();
