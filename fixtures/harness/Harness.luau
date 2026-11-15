--!strict
export type T = {
	test: (name: string, body: () -> ()) -> (),
	equal: (actual: unknown, expected: unknown) -> (),
}

return {}
