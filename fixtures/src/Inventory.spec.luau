--!strict
local Inventory = require("./Inventory")
local Shape = require("./Shape")
local Harness = require("./harness/Harness")

return Harness.spec(function(t: Harness.T)
	t.test("new keeps the items in order", function()
		local inventory = Inventory.new(3, "a", "b")
		t.equal(inventory.items, { "a", "b" })
		t.equal(Inventory.first(inventory), "a")
	end)

	t.test("each stops when the visitor returns false", function()
		local inventory = Inventory.new(3, 1, 2, 3)
		local visited, finished = Inventory.each(inventory, function(item: number): boolean
			return item < 2
		end)
		t.equal(visited, 2)
		t.equal(finished, false)
	end)

	t.test("place records a shape at a point", function()
		local placement = Inventory.place(Shape.square(1), 4, 5)
		t.equal(placement.at, { x = 4, y = 5 })
	end)
end)
