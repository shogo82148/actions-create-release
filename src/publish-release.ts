// Options is the options for publish function.
interface Options {}

// Result is the result for publish function.
interface Result {}

// publish publishes the release.
export async function publish(opt: Options): Promise<Result> {
  return opt
}
