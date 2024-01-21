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

class GitHubError {
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
}
