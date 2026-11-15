--!strict
export type Circle = { read kind: "Circle", read radius: number }
export type Square = { read kind: "Square", read side: number }
export type Shape = Circle | Square

export type function KindOf(shape: type): type
	local kind = shape:readproperty(types.singleton("kind"))
	if kind == nil then
		error("expected a Shape", 0)
	end
	return kind
end

local Shape = {}

function Shape.circle(radius: number): Circle
	return { kind = "Circle", radius = radius }
end

function Shape.square(side: number): Square
	return { kind = "Square", side = side }
end

function Shape.area(shape: Shape): number
	if shape.kind == "Circle" then
		return math.pi * shape.radius * shape.radius
	end
	return shape.side * shape.side
end

function Shape.kind<S>(shape: S): KindOf<S>
	return (shape :: any).kind
end

return Shape
