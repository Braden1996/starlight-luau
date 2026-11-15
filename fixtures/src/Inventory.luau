--!strict
local Shape = require("./Shape")

type function itemOf(inventory: type): type
	local items = inventory:readproperty(types.singleton("items"))
	if items == nil then
		error("expected an Inventory", 0)
	end
	local indexer = items:indexer()
	return if indexer then indexer.readresult else types.never
end

export type Inventory<T = string> = {
	read items: { T },
	read counts: { [T]: number },
	write label: string?,
	capacity: number,
}
export type ItemOf<I> = itemOf<I>
export type Stamped<T> = T & { read stamp: number }
export type Visitor<T, A...> = (item: T, A...) -> boolean
export type Packed<T...> = (T...) -> (number, T...)
export type Placement = { read shape: Shape.Shape, read at: { read x: number, read y: number } }
export type Lookup = typeof(setmetatable({}, { __index = {} }))

local Inventory = {}

function Inventory.new<T>(capacity: number, ...: T): Inventory<T>
	return { items = { ... }, counts = {}, label = nil, capacity = capacity }
end

function Inventory.first<I>(inventory: I): ItemOf<I>?
	return (inventory :: any).items[1]
end

function Inventory.each<T, A...>(
	inventory: Inventory<T>,
	visit: Visitor<T, A...>,
	...: A...
): (number, boolean)
	local visited = 0
	for _, item in inventory.items do
		visited += 1
		if not visit(item, ...) then
			return visited, false
		end
	end
	return visited, true
end

function Inventory.stamp<T>(value: T, stamp: number): Stamped<T>
	local stamped = table.clone(value :: any)
	stamped.stamp = stamp
	return stamped
end

function Inventory.place(shape: Shape.Shape, x: number, y: number): Placement
	return { shape = shape, at = { x = x, y = y } }
end

function Inventory.split(text: string, separator: string?): ...string
	return table.unpack(string.split(text, separator or ","))
end

function Inventory.describe(entry: string | number | boolean | nil, mode: "short" | "long"): string
	return if mode == "short" then tostring(entry) else `entry: {entry}`
end

return Inventory
