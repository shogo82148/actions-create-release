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
