import * as core from "@actions/core";
import * as release from "./create-release";
import * as github from "./github-mini";

async function run(): Promise<void> {
  try {
    const required = { required: true };
    const github_token = core.getInput("github_token", required);
    const client = new github.Client(
      github_token,
      process.env["GITHUB_API_URL"] || "https://api.github.com",
    );

    let tag_name = core.getInput("tag_name");
    const release_name = core.getInput("release_name");
    const body = core.getInput("body");
    const body_path = core.getInput("body_path");
    const draft = core.getBooleanInput("draft");
    const prerelease = core.getBooleanInput("prerelease");
    const commitish = core.getInput("commitish");
    const owner = core.getInput("owner");
    const repo = core.getInput("repo");
    const generate_release_notes = core.getBooleanInput("generate_release_notes");
    const notes_start_tag = core.getInput("notes_start_tag");
    const overwrite = core.getBooleanInput("overwrite");

    if (tag_name === "") {
      const ref = process.env["GITHUB_REF"] || "";
      if (!ref.startsWith("refs/tags/")) {
        throw new Error(`${ref} is not a tag`);
      }
      tag_name = ref.substring("refs/tags/".length);
    }
    const result = await release.create({
      client,
      tag_name,
      release_name,
      body,
      body_path,
      prerelease,
      commitish,
      owner,
      repo,
      generate_release_notes,
      notes_start_tag,
      overwrite,

      // Always create release as draft first.
      // It is to prevent users from seeing empty release.
      draft: true,

      // discussion_category_name is no effect with a draft release.
      // so we skip to pass it here.
      discussion_category_name: "",
    });
    core.setOutput("id", result.id);
    core.setOutput("html_url", result.html_url);
    core.setOutput("upload_url", result.upload_url);

    if (!draft) {
      core.saveState("id", result.id);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error);
    } else {
      core.setFailed(`${error}`);
    }
  }
}

void run();
