---
title: "Shape"
description: "Shapes as plain tagged tables. Narrow a `Shape` with `shape.kind == \"Circle\"`."
editUrl: false
sidebar:
  order: 1
---

Shapes as plain tagged tables. Narrow a `Shape` with `shape.kind == "Circle"`.

This page is generated from the Luau types in `fixtures/src/Shape.luau`; this paragraph is hand-written prose from
`fixtures/docs/api/Shape.md`.

## Types

<a id="type-Circle" class="sl-luau-anchor"></a>

### `Circle`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Circle = { <span class="luau-keyword">read </span><span class="luau-property">kind</span>: <span class="luau-string">&quot;Circle&quot;</span>, <span class="luau-keyword">read </span><span class="luau-property">radius</span>: <span class="luau-builtin">number</span> }</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L2">Source: Shape.luau, line 2</a></p>

<a id="type-Square" class="sl-luau-anchor"></a>

### `Square`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Square = { <span class="luau-keyword">read </span><span class="luau-property">kind</span>: <span class="luau-string">&quot;Square&quot;</span>, <span class="luau-keyword">read </span><span class="luau-property">side</span>: <span class="luau-builtin">number</span> }</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L3">Source: Shape.luau, line 3</a></p>

<a id="type-Shape" class="sl-luau-anchor"></a>

### `Shape`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Shape = <a class="luau-type" href="/api/shape/#type-Circle">Circle</a> | <a class="luau-type" href="/api/shape/#type-Square">Square</a></code></pre>

<table class="sl-luau-variants">
<thead><tr><th><code>kind</code></th><th>Variant</th></tr></thead>
<tbody><tr><td><code class="sl-luau-inline"><span class="luau-string">&quot;Circle&quot;</span></code></td><td><code class="sl-luau-inline"><a class="luau-type" href="/api/shape/#type-Circle">Circle</a></code></td></tr><tr><td><code class="sl-luau-inline"><span class="luau-string">&quot;Square&quot;</span></code></td><td><code class="sl-luau-inline"><a class="luau-type" href="/api/shape/#type-Square">Square</a></code></td></tr></tbody>
</table>

Every shape the library knows. Match on `kind` and end the chain with a `never` check so that a new variant is a
type error.

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L4">Source: Shape.luau, line 4</a></p>

<a id="type-KindOf" class="sl-luau-anchor"></a>

### `KindOf`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type function</span> KindOf(<span class="luau-parameter">shape</span>: <span class="luau-builtin">type</span>): <span class="luau-builtin">type</span></code></pre>

<details>
<summary>Implementation</summary>

```luau
export type function KindOf(shape: type): type
  local kind = shape:readproperty(types.singleton("kind"))
  if kind == nil then
    error("expected a Shape", 0)
  end
  return kind
end
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L6">Source: Shape.luau, line 6</a></p>

## Functions

<a id="circle" class="sl-luau-anchor"></a>

### `circle`

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Shape.circle(<span class="luau-parameter">radius</span>: <span class="luau-builtin">number</span>): <a class="luau-type" href="/api/shape/#type-Circle">Circle</a></code></pre>

#### Examples

<details>
<summary>circle and square build tagged tables</summary>

```luau
t.equal(Shape.circle(2), { kind = "Circle", radius = 2 })
t.equal(Shape.square(3), { kind = "Square", side = 3 })
```

</details>

<details>
<summary>area of a circle uses pi</summary>

```luau
t.equal(Shape.area(Shape.circle(1)), math.pi)
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L16">Source: Shape.luau, line 16</a></p>

<a id="square" class="sl-luau-anchor"></a>

### `square`

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Shape.square(<span class="luau-parameter">side</span>: <span class="luau-builtin">number</span>): <a class="luau-type" href="/api/shape/#type-Square">Square</a></code></pre>

#### Examples

<details>
<summary>circle and square build tagged tables</summary>

```luau
t.equal(Shape.circle(2), { kind = "Circle", radius = 2 })
t.equal(Shape.square(3), { kind = "Square", side = 3 })
```

</details>

<details>
<summary>area of a square is its side squared</summary>

```luau
t.equal(Shape.area(Shape.square(3)), 9)
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L20">Source: Shape.luau, line 20</a></p>

<a id="area" class="sl-luau-anchor"></a>

### `area`

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Shape.area(<span class="luau-parameter">shape</span>: <a class="luau-type" href="/api/shape/#type-Shape">Shape</a>): <span class="luau-builtin">number</span></code></pre>

The area in square units. Circles use `math.pi`, so their areas are not exact.

#### Examples

<details>
<summary>area of a square is its side squared</summary>

```luau
t.equal(Shape.area(Shape.square(3)), 9)
```

</details>

<details>
<summary>area of a circle uses pi</summary>

```luau
t.equal(Shape.area(Shape.circle(1)), math.pi)
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L24">Source: Shape.luau, line 24</a></p>

<a id="kind" class="sl-luau-anchor"></a>

### `kind`

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Shape.kind&lt;<span class="luau-generic">S</span>&gt;(<span class="luau-parameter">shape</span>: <span class="luau-generic">S</span>): <a class="luau-type" href="/api/shape/#type-KindOf">KindOf</a>&lt;<span class="luau-generic">S</span>&gt;</code></pre>

<p class="sl-luau-generics"><code>S</code> is inferred as a whole type and read through <a href="/api/shape/#type-KindOf"><code>KindOf</code></a>.</p>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Shape.luau#L31">Source: Shape.luau, line 31</a></p>
