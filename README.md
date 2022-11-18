[![test](https://github.com/shogo82148/actions-create-release/actions/workflows/test.yml/badge.svg)](https://github.com/shogo82148/actions-create-release/actions/workflows/test.yml)

# Yet Another Create Release Action

This GitHub Action creates a release.

## SYNOPSIS

```yaml
on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create Release
        uses: shogo82148/actions-create-release@v1
```

## Inputs

### tag_name

The name of the tag for this release.
The default is the tag name that triggered the workflow.

### release_name

The name of the release.

### body

Text describing the contents of the release. Optional, and not needed if using body_path.

### body_path

A file with contents describing the release. Optional, and not needed if using body.

### draft

true to create a draft (unpublished) release, false to create a published one. Default: false

### prerelease

true to identify the release as a prerelease. false to identify the release as a full release. Default: false

### make_latest

Specifies whether this release should be set as the
latest release for the repository. Drafts and prereleases cannot
be set as latest. Defaults to `true` for newly published releases.
`legacy` specifies that the latest release should be determined
based on the release creation date and higher semantic version.

### commitish

Any branch or commit SHA the Git tag is created from, unused if the Git tag already exists. Default: SHA of current commit

### owner

The name of the owner of the repo. Used to identify the owner of the repository. Used when cutting releases for external repositories. Default: Current owner

### repo

The name of the repository. Used to identify the repository on which to release. Used when cutting releases for external repositories. Default: Current repository

### discussion_category_name

If specified, a discussion of the specified category is created and linked to the release.
The value must be a category that already exists in the repository.
For more information, see "[Managing categories for discussions in your repository.](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions-in-your-repository)"

### generate_release_notes

Whether to automatically generate the name and body for this release.
If `release_name` is specified, the specified name will be used;
otherwise, a name will be automatically generated. If `body` or `body_path` is specified,
the body will be pre-pended to the automatically generated notes.
For more information, see "[Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)".

## Outputs

### id

The release ID

### html_url

The URL users can navigate to in order to view the release. i.e. https://github.com/octocat/Hello-World/releases/v1.0.0

### upload_url

The URL for uploading assets to the release, which could be used by GitHub Actions for additional uses, for example the [shogo82148/actions-upload-release-asset](https://github.com/shogo82148/actions-upload-release-asset) GitHub Action

## Related works

- [actions/create-release](https://github.com/actions/create-release)
- [elgohr/Github-Release-Action](https://github.com/elgohr/Github-Release-Action)
- [marvinpinto/action-automatic-releases](https://github.com/marvinpinto/action-automatic-releases)
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release)
- [ncipollo/release-action](https://github.com/ncipollo/release-action)
