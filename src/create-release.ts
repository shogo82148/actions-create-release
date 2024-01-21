import * as core from "@actions/core";
import * as fs from "fs";
import * as http from "@actions/http-client";
import * as github from "./github-mini";

// Options is the options for create function.
interface Options {
  client: github.Client;
  github_token: string;
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

      await deleteRelease({
        github_token: opt.github_token,
        owner,
        repo,
        id: release.id,
      });
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

const newGitHubClient = (token: string): http.HttpClient => {
  return new http.HttpClient("shogo82148-actions-create-release/v1", [], {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
};

interface ReposDeleteReleaseParams {
  github_token: string;
  owner: string;
  repo: string;
  id: number;
}

// minimum implementation of deleting a release API
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#delete-a-release
const deleteRelease = async (params: ReposDeleteReleaseParams): Promise<void> => {
  const client = newGitHubClient(params.github_token);
  const api = process.env["GITHUB_API_URL"] || "https://api.github.com";
  const url = `${api}/repos/${params.owner}/${params.repo}/releases/${params.id}`;
  const resp = await client.request("DELETE", url, "", {});
  const statusCode = resp.message.statusCode;
  if (statusCode !== 204) {
    const contents = await resp.readBody();
    throw new Error(`unexpected status code: ${statusCode}\n${contents}`);
  }
  return;
};
