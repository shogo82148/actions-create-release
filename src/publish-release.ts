import * as core from "@actions/core";
import * as github from "./github-mini";

const handleGitHubError = (msg: string, error: github.GitHubError): never => {
  core.error(
    `${msg}: unexpected status code: ${error.statusCode}, error: ${JSON.stringify(error.error)}`,
  );
  throw new Error(`unexpected status code: ${error.statusCode}`);
};

// Options is the options for publish function.
interface Options {
  client: github.Client;

  owner: string;
  repo: string;
  id: string;
  discussion_category_name: string;
  make_latest?: github.MakeLatest;
}

// publish publishes the release.
export async function publish(opt: Options): Promise<void> {
  const repository = process.env["GITHUB_REPOSITORY"]?.split("/") || ["", ""];
  const owner = opt.owner || repository[0];
  const repo = opt.repo || repository[1];
  const discussion_category_name =
    opt.discussion_category_name !== "" ? opt.discussion_category_name : undefined;
  const make_latest = opt.make_latest;

  const resp = await opt.client.updateRelease({
    owner,
    repo,
    id: opt.id,
    draft: false,
    discussion_category_name,
    make_latest,
  });
  if (resp.isFailure()) {
    return handleGitHubError("failed to publish new release", resp.value);
  }
}
