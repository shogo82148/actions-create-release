import * as release from "../src/publish-release";
import * as github from "../src/github-mini";

test("publish a new release", async () => {
  const updateRelease = jest
    .spyOn(github.Client.prototype, "updateRelease")
    .mockImplementation(
      async (
        params: github.UpdateReleaseParams,
      ): Promise<github.Result<github.UpdateReleaseResponse, github.GitHubError>> => {
        expect(params).toEqual({
          owner: "shogo82148",
          repo: "github-action-test",
          id: "123",
          draft: false,
          discussion_category_name: "Test discussion",
          make_latest: "true",
        });
        return new github.Success({
          id: 123,
          html_url: "http://example.com/html",
          upload_url: "http://example.com/upload",
        });
      },
    );

  const client = new github.Client("", "http://localhost:1234");
  await release.publish({
    client,
    id: "123",
    owner: "shogo82148",
    repo: "github-action-test",
    discussion_category_name: "Test discussion",
    make_latest: "true",
  });
  expect(updateRelease).toHaveBeenCalled();
});
