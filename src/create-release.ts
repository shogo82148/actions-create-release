// Options is the options for create function.
interface Options {}

// Result is the result for create function.
interface Result {}

// create creates a new release.
export async function create(opt: Options): Promise<Result> {
  return opt
}
