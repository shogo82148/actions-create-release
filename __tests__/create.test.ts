import * as release from "../src/create-release";
import * as github from "../src/github-mini";

test("create a new release", async () => {
  const createRelease = jest
    .spyOn(github.Client.prototype, "createRelease")
    .mockImplementation(
      async (
        params: github.CreateReleaseParams,
      ): Promise<github.Result<github.CreateReleaseResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag_name: "v1.0.0",
          name: undefined,
          body: undefined,
          target_commitish: undefined,
          draft: false,
          prerelease: false,
          discussion_category_name: undefined,
          generate_release_notes: false,
        });
        return new github.Success({
          id: 123,
          html_url: "http://example.com/html",
          upload_url: "http://example.com/upload",
        });
      },
    );

  const client = new github.Client("", "http://localhost:1234");
  const resp = await release.create({
    client,
    tag_name: "v1.0.0",
    release_name: "",
    body: "",
    body_path: "",
    draft: false,
    prerelease: false,
    commitish: "",
    owner: "shogo82148",
    repo: "github-action-test",
    discussion_category_name: "",
    generate_release_notes: false,
    overwrite: false,
  });
  expect(createRelease).toHaveBeenCalled();
  expect(resp.id).toBe("123");
  expect(resp.html_url).toBe("http://example.com/html");
  expect(resp.upload_url).toBe("http://example.com/upload");
});

test("overwrite the existing release", async () => {
  const getReleaseByTagName = jest
    .spyOn(github.Client.prototype, "getReleaseByTagName")
    .mockImplementation(
      async (
        params: github.GetReleaseByTagNameParams,
      ): Promise<github.Result<github.GetReleaseByTagNameResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag: "v1.0.0",
        });
        return new github.Success({
          id: 123,
          tag_name: "v1.0.0",
          target_commitish: "deadbeef",
        });
      },
    );
  const deleteRelease = jest
    .spyOn(github.Client.prototype, "deleteRelease")
    .mockImplementation(
      async (
        params: github.DeleteReleaseParams,
      ): Promise<github.Result<void, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          id: 123,
        });
        return new github.Success(undefined);
      },
    );
  const deleteTag = jest.spyOn(github.Client.prototype, "deleteTag");
  const createRelease = jest
    .spyOn(github.Client.prototype, "createRelease")
    .mockImplementation(
      async (
        params: github.CreateReleaseParams,
      ): Promise<github.Result<github.CreateReleaseResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag_name: "v1.0.0",
          name: undefined,
          body: undefined,
          target_commitish: undefined,
          draft: false,
          prerelease: false,
          discussion_category_name: undefined,
          generate_release_notes: false,
        });
        return new github.Success({
          id: 124,
          html_url: "http://example.com/html",
          upload_url: "http://example.com/upload",
        });
      },
    );

  const client = new github.Client("", "http://localhost:1234");
  const resp = await release.create({
    client,
    tag_name: "v1.0.0",
    release_name: "",
    body: "",
    body_path: "",
    draft: false,
    prerelease: false,
    commitish: "",
    owner: "shogo82148",
    repo: "github-action-test",
    discussion_category_name: "",
    generate_release_notes: false,
    overwrite: true,
  });
  expect(getReleaseByTagName).toHaveBeenCalled();
  expect(deleteRelease).toHaveBeenCalled();
  expect(deleteTag).not.toHaveBeenCalled();
  expect(createRelease).toHaveBeenCalled();
  expect(resp.id).toBe("124");
  expect(resp.html_url).toBe("http://example.com/html");
  expect(resp.upload_url).toBe("http://example.com/upload");
});

test("overwrite the existing release and tag", async () => {
  const getReleaseByTagName = jest
    .spyOn(github.Client.prototype, "getReleaseByTagName")
    .mockImplementation(
      async (
        params: github.GetReleaseByTagNameParams,
      ): Promise<github.Result<github.GetReleaseByTagNameResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag: "v1.0.0",
        });
        return new github.Success({
          id: 123,
          tag_name: "v1.0.0",
          target_commitish: "deadbeef",
        });
      },
    );
  const deleteRelease = jest
    .spyOn(github.Client.prototype, "deleteRelease")
    .mockImplementation(
      async (
        params: github.DeleteReleaseParams,
      ): Promise<github.Result<void, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          id: 123,
        });
        return new github.Success(undefined);
      },
    );
  const deleteTag = jest
    .spyOn(github.Client.prototype, "deleteTag")
    .mockImplementation(
      async (params: github.DeleteTagParams): Promise<github.Result<void, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag: "v1.0.0",
        });
        return new github.Success(undefined);
      },
    );
  const createRelease = jest
    .spyOn(github.Client.prototype, "createRelease")
    .mockImplementation(
      async (
        params: github.CreateReleaseParams,
      ): Promise<github.Result<github.CreateReleaseResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag_name: "v1.0.0",
          name: undefined,
          body: undefined,
          target_commitish: "deadbeef",
          draft: false,
          prerelease: false,
          discussion_category_name: undefined,
          generate_release_notes: false,
        });
        return new github.Success({
          id: 124,
          html_url: "http://example.com/html",
          upload_url: "http://example.com/upload",
        });
      },
    );

  const client = new github.Client("", "http://localhost:1234");
  const resp = await release.create({
    client,
    tag_name: "v1.0.0",
    release_name: "",
    body: "",
    body_path: "",
    draft: false,
    prerelease: false,
    commitish: "deadbeef",
    owner: "shogo82148",
    repo: "github-action-test",
    discussion_category_name: "",
    generate_release_notes: false,
    overwrite: true,
  });
  expect(getReleaseByTagName).toHaveBeenCalled();
  expect(deleteRelease).toHaveBeenCalled();
  expect(deleteTag).toHaveBeenCalled();
  expect(createRelease).toHaveBeenCalled();
  expect(resp.id).toBe("124");
  expect(resp.html_url).toBe("http://example.com/html");
  expect(resp.upload_url).toBe("http://example.com/upload");
});

test("overwrite not-existing release", async () => {
  const getReleaseByTagName = jest
    .spyOn(github.Client.prototype, "getReleaseByTagName")
    .mockImplementation(
      async (
        params: github.GetReleaseByTagNameParams,
      ): Promise<github.Result<github.GetReleaseByTagNameResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag: "v1.0.0",
        });
        return new github.Failure(
          new github.GitHubError(404, {
            message: "not found",
            documentation_url: "http://example.com",
          }),
        );
      },
    );
  const deleteRelease = jest.spyOn(github.Client.prototype, "deleteRelease");
  const createRelease = jest
    .spyOn(github.Client.prototype, "createRelease")
    .mockImplementation(
      async (
        params: github.CreateReleaseParams,
      ): Promise<github.Result<github.CreateReleaseResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          tag_name: "v1.0.0",
          name: undefined,
          body: undefined,
          target_commitish: undefined,
          draft: false,
          prerelease: false,
          discussion_category_name: undefined,
          generate_release_notes: false,
        });
        return new github.Success({
          id: 124,
          html_url: "http://example.com/html",
          upload_url: "http://example.com/upload",
        });
      },
    );

  const client = new github.Client("", "http://localhost:1234");
  const resp = await release.create({
    client,
    tag_name: "v1.0.0",
    release_name: "",
    body: "",
    body_path: "",
    draft: false,
    prerelease: false,
    commitish: "",
    owner: "shogo82148",
    repo: "github-action-test",
    discussion_category_name: "",
    generate_release_notes: false,
    overwrite: true,
  });
  expect(getReleaseByTagName).toHaveBeenCalled();
  expect(deleteRelease).not.toHaveBeenCalled();
  expect(createRelease).toHaveBeenCalled();
  expect(resp.id).toBe("124");
  expect(resp.html_url).toBe("http://example.com/html");
  expect(resp.upload_url).toBe("http://example.com/upload");
});
