import * as http from "@actions/http-client";

// Options is the options for publish function.
interface Options {
  github_token: string;
  owner: string;
  repo: string;
  id: string;
  discussion_category_name: string;

  updateRelease?: (params: ReposUpdateReleaseParams) => Promise<void>;
}

// publish publishes the release.
export async function publish(opt: Options): Promise<void> {
  const repository = process.env["GITHUB_REPOSITORY"]?.split("/") || ["", ""];
  const owner = opt.owner || repository[0];
  const repo = opt.repo || repository[1];
  const discussion_category_name =
    opt.discussion_category_name !== "" ? opt.discussion_category_name : undefined;
  const updater = opt.updateRelease || updateRelease;
  await updater({
    github_token: opt.github_token,
    owner,
    repo,
    id: opt.id,
    draft: false,
    discussion_category_name,
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

interface ReposUpdateReleaseParams {
  github_token: string;
  owner: string;
  repo: string;
  id: string;
  draft: boolean;
  discussion_category_name?: string | undefined;
}

// minium implementation of create a release API
// https://docs.github.com/en/rest/reference/repos#create-a-release
const updateRelease = async (params: ReposUpdateReleaseParams): Promise<void> => {
  const client = newGitHubClient(params.github_token);
  const body = JSON.stringify({
    draft: params.draft,
    discussion_category_name: params.discussion_category_name,
  });
  const api = process.env["GITHUB_API_URL"] || "https://api.github.com";
  const url = `${api}/repos/${params.owner}/${params.repo}/releases/${params.id}`;
  const resp = await client.request("PATCH", url, body, {});
  const statusCode = resp.message.statusCode;
  const contents = await resp.readBody();
  if (statusCode !== 200) {
    throw new Error(`unexpected status code: ${statusCode}\n${contents}`);
  }
};
