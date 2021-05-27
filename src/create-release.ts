// Options is the options for create function.
interface Options {
  tag_name: string
  release_name: string
  body: string
  body_path: string
  draft: boolean
  prerelease: boolean
  commitish: string
  owner: string
  repo: string
}

// Result is the result for create function.
interface Result {
  id: string
  html_url: string
  upload_url: string
}

// create creates a new release.
export async function create(opt: Options): Promise<Result> {
  return {
    id: '',
    html_url: '',
    upload_url: ''
  }
}
