import * as core from "@actions/core";
import * as fs from "fs";
import * as http from "@actions/http-client";

// Options is the options for create function.
interface Options {
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

  createRelease?: (params: ReposCreateReleaseParams) => Promise<ReposCreateReleaseResponse>;
}

// Result is the result for create function.
interface Result {
  id: string;
  html_url: string;
  upload_url: string;
}

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
    try {
      const release = await getReleaseByTagName({
        github_token: opt.github_token,
        owner,
        repo,
        tag: opt.tag_name,
      });

      core.warning(`delete the existing release: ${release.id}`);
      await deleteRelease({
        github_token: opt.github_token,
        owner,
        repo,
        id: release.id,
      });
      if (!target_commitish) {
        await deleteTag({
          github_token: opt.github_token,
          owner,
          repo,
          tag: opt.tag_name,
        });
      }
    } catch (error) {}
  }

  const creator = opt.createRelease || createRelease;
  const resp = await creator({
    github_token: opt.github_token,
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
  return {
    id: `${resp.id}`,
    html_url: resp.html_url,
    upload_url: resp.upload_url,
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

interface ReposGetReleaseByTagNameParams {
  github_token: string;
  owner: string;
  repo: string;
  tag: string;
}

interface ReposGetReleaseByTagNameResponse {
  id: number;

  // we don't need other fields
  // other fields are omitted
}

// minium implementation of get a release by tag name API
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
const getReleaseByTagName = async (
  params: ReposGetReleaseByTagNameParams,
): Promise<ReposGetReleaseByTagNameResponse> => {
  const client = newGitHubClient(params.github_token);
  const api = process.env["GITHUB_API_URL"] || "https://api.github.com";
  const url = `${api}/repos/${params.owner}/${params.repo}/releases/tags/${params.tag}`;
  const resp = await client.request("GET", url, "", {});
  const statusCode = resp.message.statusCode;
  const contents = await resp.readBody();
  if (statusCode !== 200) {
    throw new Error(`unexpected status code: ${statusCode}\n${contents}`);
  }
  return JSON.parse(contents) as ReposGetReleaseByTagNameResponse;
};

interface ReposCreateReleaseParams {
  github_token: string;
  owner: string;
  repo: string;
  tag_name: string;
  target_commitish?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  discussion_category_name?: string;
  generate_release_notes?: boolean;
}

interface ReposCreateReleaseResponse {
  id: number;
  html_url: string;
  upload_url: string;
}

// minium implementation of create a release API
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release
const createRelease = async (
  params: ReposCreateReleaseParams,
): Promise<ReposCreateReleaseResponse> => {
  const client = newGitHubClient(params.github_token);
  const body = JSON.stringify({
    tag_name: params.tag_name,
    target_commitish: params.target_commitish,
    name: params.name,
    body: params.body,
    draft: params.draft,
    prerelease: params.prerelease,
    discussion_category_name: params.discussion_category_name,
    generate_release_notes: params.generate_release_notes,
  });
  const api = process.env["GITHUB_API_URL"] || "https://api.github.com";
  const url = `${api}/repos/${params.owner}/${params.repo}/releases`;
  const resp = await client.request("POST", url, body, {});
  const statusCode = resp.message.statusCode;
  const contents = await resp.readBody();
  if (statusCode !== 201) {
    throw new Error(`unexpected status code: ${statusCode}\n${contents}`);
  }
  return JSON.parse(contents) as ReposCreateReleaseResponse;
};

interface ReposDeleteTagParams {
  github_token: string;
  owner: string;
  repo: string;
  tag: string;
}

// minimum implementation of deleting a tag API
// https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#delete-a-reference
const deleteTag = async (params: ReposDeleteTagParams): Promise<void> => {
  const client = newGitHubClient(params.github_token);
  const api = process.env["GITHUB_API_URL"] || "https://api.github.com";
  const url = `${api}/repos/${params.owner}/${params.repo}/git/refs/tags/${params.tag}`;
  const resp = await client.request("DELETE", url, "", {});
  const statusCode = resp.message.statusCode;
  if (statusCode !== 204) {
    const contents = await resp.readBody();
    throw new Error(`unexpected status code: ${statusCode}\n${contents}`);
  }
  return;
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
