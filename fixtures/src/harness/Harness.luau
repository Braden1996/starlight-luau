--!strict
export type T = {
	test: (name: string, body: () -> ()) -> (),
	equal: (actual: unknown, expected: unknown) -> (),
}

local function same(actual: unknown, expected: unknown): boolean
	if type(actual) ~= "table" or type(expected) ~= "table" then
		return actual == expected
	end
	local actualEntries = actual :: { [unknown]: unknown }
	local expectedEntries = expected :: { [unknown]: unknown }
	for key, value in actualEntries do
		if not same(value, expectedEntries[key]) then
			return false
		end
	end
	for key in expectedEntries do
		if actualEntries[key] == nil then
			return false
		end
	end
	return true
end

local function spec(define: (T) -> ()): { [string]: () -> () }
	local cases: { [string]: () -> () } = {}
	define({
		test = function(name, body)
			assert(cases[name] == nil, "duplicate test: " .. name)
			cases[name] = body
		end,
		equal = function(actual, expected)
			assert(same(actual, expected), "values differ")
		end,
	})
	return cases
end

return { spec = spec }
