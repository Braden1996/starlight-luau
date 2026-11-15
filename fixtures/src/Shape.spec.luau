--!strict
local Harness = require("../harness/Harness")
local Shape = require("./Shape")

return function(t: Harness.T)
	t.test("circle and square build tagged tables", function()
		t.equal(Shape.circle(2), { kind = "Circle", radius = 2 })
		t.equal(Shape.square(3), { kind = "Square", side = 3 })
	end)

	t.test("area of a square is its side squared", function()
		t.equal(Shape.area(Shape.square(3)), 9)
	end)

	t.test("area of a circle uses pi", function()
		t.equal(Shape.area(Shape.circle(1)), math.pi)
	end)
end
