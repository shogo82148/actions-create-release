import * as release from "../src/create-release";

test("Create a new release", async () => {
  const createRelease = jest.fn().mockReturnValue({
    id: 123,
    html_url: "http://example.com/html",
    upload_url: "http://example.com/upload",
  });

  const resp = await release.create({
    github_token: "very-secret",
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
    createRelease: createRelease,
  });
  expect(createRelease).toBeCalledTimes(1);
  expect(createRelease).toHaveBeenCalledWith({
    github_token: "very-secret",
    tag_name: "v1.0.0",
    name: undefined,
    body: undefined,
    draft: false,
    prerelease: false,
    owner: "shogo82148",
    repo: "github-action-test",
  });
  expect(resp.id).toBe("123");
  expect(resp.html_url).toBe("http://example.com/html");
  expect(resp.upload_url).toBe("http://example.com/upload");
});
