import * as core from "@actions/core";
import * as release from "./publish-release";
import * as github from "./github-mini";

async function run(): Promise<void> {
  try {
    const id = core.getState("id");
    if (id === "") {
      // skip to publish
      return;
    }

    const required = { required: true };
    const github_token = core.getInput("github_token", required);
    const client = new github.Client(
      github_token,
      process.env["GITHUB_API_URL"] || "https://api.github.com",
    );
    const owner = core.getInput("owner");
    const repo = core.getInput("repo");
    const discussion_category_name = core.getInput("discussion_category_name");
    const make_latest_input = core.getInput("make_latest") || undefined;

    let make_latest: github.MakeLatest | undefined;
    switch (make_latest_input) {
      case undefined:
      case "true":
      case "false":
      case "legacy":
        make_latest = make_latest_input;
        break;
      default:
        throw new Error(`invalid value for make_latest: ${make_latest_input}`);
    }

    await release.publish({
      client,
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

void run();
