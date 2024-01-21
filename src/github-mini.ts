// minimum implementation of GitHub API Client

import * as http from "@actions/http-client";

// Result is a type that represents either Success or Failure.
// ref. https://dev.classmethod.jp/articles/error-handling-practice-of-typescript/
type Result<T, E> = Success<T, E> | Failure<T, E>;

class Success<T, E> {
  constructor(readonly value: T) {}
  isSuccess(): this is Success<T, E> {
    return true;
  }
  isFailure(): this is Failure<T, E> {
    return false;
  }
}

class Failure<T, E> {
  constructor(readonly value: E) {}
  isSuccess(): this is Success<T, E> {
    return false;
  }
  isFailure(): this is Failure<T, E> {
    return true;
  }
}

interface GitHubErrorValue {
  message: string;
  documentation_url: string;
  errors?: {
    resource: string;
    field: string;
    code: string;
  }[];
}

export class GitHubError {
  constructor(
    readonly statusCode: number,
    readonly error: GitHubErrorValue,
  ) {}
}

interface GetReleaseByTagNameParams {
  owner: string;
  repo: string;
  tag: string;
}

interface GetReleaseByTagNameResponse {
  id: number;
  tag_name: string;
  target_commitish: string;

  // we don't need other fields
  // other fields are omitted
}

interface CreateReleaseParams {
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

interface CreateReleaseResponse {
  id: number;
  html_url: string;
  upload_url: string;
}

interface DeleteReleaseParams {
  owner: string;
  repo: string;
  id: number;
}

interface DeleteTagParams {
  owner: string;
  repo: string;
  tag: string;
}

export class Client {
  httpClient: http.HttpClient;

  constructor(
    readonly token: string,
    readonly apiUrl: string,
  ) {
    this.httpClient = new http.HttpClient("shogo82148-actions-create-release/v1", [], {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }

  // minium implementation of get a release by tag name API
  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
  async getReleaseByTagName(
    params: GetReleaseByTagNameParams,
  ): Promise<Result<GetReleaseByTagNameResponse, GitHubError>> {
    const url = `${this.apiUrl}/repos/${params.owner}/${params.repo}/releases/tags/${params.tag}`;
    const resp = await this.httpClient.getJson(url);
    if (resp.statusCode !== http.HttpCodes.OK) {
      return new Failure(new GitHubError(resp.statusCode, resp.result as GitHubErrorValue));
    }
    return new Success(resp.result as GetReleaseByTagNameResponse);
  }

  // minium implementation of create a release API
  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release
  async createRelease(
    params: CreateReleaseParams,
  ): Promise<Result<CreateReleaseResponse, GitHubError>> {
    const url = `${this.apiUrl}/repos/${params.owner}/${params.repo}/releases`;
    const resp = await this.httpClient.postJson(url, params);
    if (resp.statusCode !== 201) {
      return new Failure(new GitHubError(resp.statusCode, resp.result as GitHubErrorValue));
    }
    return new Success(resp.result as CreateReleaseResponse);
  }

  // minimum implementation of deleting a release API
  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#delete-a-release
  async deleteRelease(params: DeleteReleaseParams): Promise<Result<void, GitHubError>> {
    const url = `${this.apiUrl}/repos/${params.owner}/${params.repo}/releases/${params.id}`;
    const resp = await this.httpClient.request("DELETE", url, "", {});
    const statusCode = resp.message.statusCode ?? 0;
    if (statusCode !== 204) {
      const contents = await resp.readBody();
      return new Failure(new GitHubError(statusCode, JSON.parse(contents) as GitHubErrorValue));
    }
    return new Success(undefined);
  }

  // minimum implementation of deleting a tag API
  // https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#delete-a-reference
  async deleteTag(params: DeleteTagParams): Promise<Result<void, GitHubError>> {
    const url = `${this.apiUrl}/repos/${params.owner}/${params.repo}/git/refs/tags/${params.tag}`;
    const resp = await this.httpClient.request("DELETE", url, "", {});
    const statusCode = resp.message.statusCode ?? 0;
    if (statusCode !== 204) {
      const contents = await resp.readBody();
      return new Failure(new GitHubError(statusCode, JSON.parse(contents) as GitHubErrorValue));
    }
    return new Success(undefined);
  }
}
