import * as core from "@actions/core";
import * as fs from "fs/promises";
import * as github from "./github-mini";

// Options is the options for create function.
interface Options {
  client: github.Client;

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
  notes_start_tag: string;
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
  const target_commitish = opt.commitish || undefined;
  const discussion_category_name = opt.discussion_category_name || undefined;

  // generate the release body.
  let name = opt.release_name || undefined;
  let body: string | undefined;
  let generate_release_notes = false;
  if (opt.body_path) {
    body = await fs.readFile(opt.body_path, "utf8");
  }
  if (opt.body) {
    body ??= opt.body;
  }
  if (opt.generate_release_notes) {
    if (opt.notes_start_tag) {
      const resp = await opt.client.generateReleaseNotes({
        owner,
        repo,
        tag_name: opt.tag_name,
        target_commitish: target_commitish,
        previous_tag_name: opt.notes_start_tag,
      });
      if (resp.isFailure()) {
        if (resp.value.statusCode !== 404) {
          return handleGitHubError("failed to generate release notes", resp.value);
        }
      } else {
        body = body ? `${body}\n${resp.value.body}` : resp.value.body;
        name ||= resp.value.name;
      }
    } else {
      generate_release_notes = true;
    }
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
      const deleteResult = await opt.client.deleteRelease({
        owner,
        repo,
        id: release.id,
      });
      if (deleteResult.isFailure()) {
        return handleGitHubError("failed to delete the existing release", deleteResult.value);
      }

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
