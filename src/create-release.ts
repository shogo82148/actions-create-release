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
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
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
// https://docs.github.com/en/rest/reference/repos#create-a-release
const createRelease = async (
  params: ReposCreateReleaseParams
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
