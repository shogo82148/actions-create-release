import * as core from "@actions/core";
import * as fs from "fs";
import * as github from "./github-mini";

// Options is the options for create function.
interface Options {
  client: github.Client;

  tag_name: string;
  release_name: string;
  body: string;
  body_path: string;
  draft: boolean;
  prerelease: boolean;
  commitish: string;
  owner: string;
  repo: string;
  discussion_category_name: string;
  generate_release_notes: boolean;
  overwrite: boolean;
}

// Result is the result for create function.
interface Result {
  id: string;
  html_url: string;
  upload_url: string;
}

const handleGitHubError = (msg: string, error: github.GitHubError): never => {
  core.error(
    `${msg}: unexpected status code: ${error.statusCode}, error: ${JSON.stringify(error.error)}`,
  );
  throw new Error(`unexpected status code: ${error.statusCode}`);
};

// create creates a new release.
export async function create(opt: Options): Promise<Result> {
  const repository = process.env["GITHUB_REPOSITORY"]?.split("/") || ["", ""];
  const owner = opt.owner || repository[0];
  const repo = opt.repo || repository[1];
  let name: string | undefined;
  let body: string | undefined;
  let target_commitish: string | undefined;
  let discussion_category_name: string | undefined;
  const generate_release_notes = opt.generate_release_notes;

  if (opt.release_name !== "") {
    name = opt.release_name;
  }
  if (opt.body_path !== "") {
    body = await readFile(opt.body_path);
  }
  if (!body && opt.body !== "") {
    body = opt.body;
  }
  if (opt.commitish !== "") {
    target_commitish = opt.commitish;
  }
  if (opt.discussion_category_name !== "") {
    discussion_category_name = opt.discussion_category_name;
  }

  if (opt.overwrite) {
    // delete the release if it already exists.
    const resp = await opt.client.getReleaseByTagName({
      owner,
      repo,
      tag: opt.tag_name,
    });
    if (resp.isFailure()) {
      if (resp.value.statusCode !== 404) {
        return handleGitHubError("failed to get the existing release", resp.value);
      }
    } else {
      const release = resp.value;
      core.warning(`delete the existing release: ${release.id}`);
      const deleteResult = await opt.client.deleteRelease({
        owner,
        repo,
        id: release.id,
      });
      if (deleteResult.isFailure()) {
        return handleGitHubError("failed to delete the existing release", deleteResult.value);
      }

      if (target_commitish) {
        core.warning(`delete the existing tag: ${release.tag_name}, ${release.target_commitish}`);
        const resp = await opt.client.deleteTag({
          owner,
          repo,
          tag: release.tag_name,
        });
        if (resp.isFailure()) {
          return handleGitHubError("failed to delete the existing tag", resp.value);
        }
      }
    }
  }

  const resp = await opt.client.createRelease({
    owner,
    repo,
    tag_name: opt.tag_name,
    target_commitish,
    name,
    body,
    draft: opt.draft,
    prerelease: opt.prerelease,
    discussion_category_name,
    generate_release_notes,
  });
  if (resp.isFailure()) {
    return handleGitHubError("failed to create a release", resp.value);
  }

  const release = resp.value;
  return {
    id: `${release.id}`,
    html_url: release.html_url,
    upload_url: release.upload_url,
  };
}

// a wrapper for fs.readFile
async function readFile(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, { encoding: "utf8" }, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}
