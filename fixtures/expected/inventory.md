---
title: "Inventory"
description: "API reference for the Inventory module."
editUrl: false
sidebar:
  order: 2
---

## Types

<a id="type-itemOf" class="sl-luau-anchor"></a>

### `itemOf`

<pre class="sl-luau-signature"><code><span class="luau-keyword">type function</span> itemOf(<span class="luau-parameter">inventory</span>: <span class="luau-builtin">type</span>): <span class="luau-builtin">type</span></code></pre>

<details>
<summary>Implementation</summary>

```luau
type function itemOf(inventory: type): type
  local items = inventory:readproperty(types.singleton("items"))
  if items == nil then
    error("expected an Inventory", 0)
  end
  local indexer = items:indexer()
  return if indexer then indexer.readresult else types.never
end
```

</details>

<p class="sl-luau-note">Not exported. It is listed because the public API refers to it.</p>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L4">Source: Inventory.luau, line 4</a></p>

<a id="type-Inventory" class="sl-luau-anchor"></a>

### `Inventory`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Inventory&lt;<span class="luau-generic">T</span> = <span class="luau-builtin">string</span>&gt; = {
  <span class="luau-keyword">read </span><span class="luau-property">items</span>: { <span class="luau-generic">T</span> },
  <span class="luau-keyword">read </span><span class="luau-property">counts</span>: { [<span class="luau-generic">T</span>]: <span class="luau-builtin">number</span> },
  <span class="luau-keyword">write </span><span class="luau-property">label</span>: <span class="luau-builtin">string</span>?,
  <span class="luau-property">capacity</span>: <span class="luau-builtin">number</span>,
}</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L13">Source: Inventory.luau, line 13</a></p>

<a id="type-ItemOf" class="sl-luau-anchor"></a>

### `ItemOf`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> ItemOf&lt;<span class="luau-generic">I</span>&gt; = <a class="luau-type" href="/api/inventory/#type-itemOf">itemOf</a>&lt;<span class="luau-generic">I</span>&gt;</code></pre>

<p>Computed by the type function <a href="/api/inventory/#type-itemOf"><code>itemOf</code></a>.</p>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L19">Source: Inventory.luau, line 19</a></p>

<a id="type-Stamped" class="sl-luau-anchor"></a>

### `Stamped`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Stamped&lt;<span class="luau-generic">T</span>&gt; = <span class="luau-generic">T</span> &amp; { <span class="luau-keyword">read </span><span class="luau-property">stamp</span>: <span class="luau-builtin">number</span> }</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L20">Source: Inventory.luau, line 20</a></p>

<a id="type-Visitor" class="sl-luau-anchor"></a>

### `Visitor`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Visitor&lt;<span class="luau-generic">T</span>, <span class="luau-generic">A...</span>&gt; = (<span class="luau-parameter">item</span>: <span class="luau-generic">T</span>, <span class="luau-generic">A...</span>) -&gt; <span class="luau-builtin">boolean</span></code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L21">Source: Inventory.luau, line 21</a></p>

<a id="type-Packed" class="sl-luau-anchor"></a>

### `Packed`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Packed&lt;<span class="luau-generic">T...</span>&gt; = (<span class="luau-generic">T...</span>) -&gt; (<span class="luau-builtin">number</span>, <span class="luau-generic">T...</span>)</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L22">Source: Inventory.luau, line 22</a></p>

<a id="type-Placement" class="sl-luau-anchor"></a>

### `Placement`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Placement = {
  <span class="luau-keyword">read </span><span class="luau-property">shape</span>: Shape.<a class="luau-type" href="/api/shape/#type-Shape">Shape</a>,
  <span class="luau-keyword">read </span><span class="luau-property">at</span>: { <span class="luau-keyword">read </span><span class="luau-property">x</span>: <span class="luau-builtin">number</span>, <span class="luau-keyword">read </span><span class="luau-property">y</span>: <span class="luau-builtin">number</span> },
}</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L23">Source: Inventory.luau, line 23</a></p>

<a id="type-Lookup" class="sl-luau-anchor"></a>

### `Lookup`

<pre class="sl-luau-signature"><code><span class="luau-keyword">export type</span> Lookup = typeof(setmetatable({}, { __index = {} }))</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L24">Source: Inventory.luau, line 24</a></p>

## Functions

<a id="new" class="sl-luau-anchor"></a>

### `new`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-success" data-status="modelled" title="The fake behaves like the game.">Modelled</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.new&lt;<span class="luau-generic">T</span>&gt;(<span class="luau-parameter">capacity</span>: <span class="luau-builtin">number</span>, ...: <span class="luau-generic">T</span>): <a class="luau-type" href="/api/inventory/#type-Inventory">Inventory</a>&lt;<span class="luau-generic">T</span>&gt;</code></pre>

#### Examples

<details>
<summary>new keeps the items in order</summary>

```luau
local inventory = Inventory.new(3, "a", "b")
t.equal(inventory.items, { "a", "b" })
t.equal(Inventory.first(inventory), "a")
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L28">Source: Inventory.luau, line 28</a></p>

<a id="first" class="sl-luau-anchor"></a>

### `first`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-success" data-status="modelled" title="The fake behaves like the game.">Modelled</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.first&lt;<span class="luau-generic">I</span>&gt;(<span class="luau-parameter">inventory</span>: <span class="luau-generic">I</span>): <a class="luau-type" href="/api/inventory/#type-ItemOf">ItemOf</a>&lt;<span class="luau-generic">I</span>&gt;?</code></pre>

<p class="sl-luau-generics"><code>I</code> is inferred as a whole type and read through <a href="/api/inventory/#type-ItemOf"><code>ItemOf</code></a>.</p>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L32">Source: Inventory.luau, line 32</a></p>

<a id="each" class="sl-luau-anchor"></a>

### `each`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-note" data-status="recorded" title="Replays values captured in the game.">Recorded</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.each&lt;<span class="luau-generic">T</span>, <span class="luau-generic">A...</span>&gt;(
  <span class="luau-parameter">inventory</span>: <a class="luau-type" href="/api/inventory/#type-Inventory">Inventory</a>&lt;<span class="luau-generic">T</span>&gt;,
  <span class="luau-parameter">visit</span>: <a class="luau-type" href="/api/inventory/#type-Visitor">Visitor</a>&lt;<span class="luau-generic">T</span>, <span class="luau-generic">A...</span>&gt;,
  ...: <span class="luau-generic">A...</span>
): (<span class="luau-builtin">number</span>, <span class="luau-builtin">boolean</span>)</code></pre>

Extra arguments after `visit` are passed to every call of `visit`, so a visitor can take context without a closure.

#### Examples

<details>
<summary>each stops when the visitor returns false</summary>

```luau
local inventory = Inventory.new(3, 1, 2, 3)
local visited, finished = Inventory.each(inventory, function(item: number): boolean
  return item < 2
end)
t.equal(visited, 2)
t.equal(finished, false)
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L36">Source: Inventory.luau, line 36</a></p>

<a id="stamp" class="sl-luau-anchor"></a>

### `stamp`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-danger" data-status="not-faked" title="Calling it fails.">Not faked</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.stamp&lt;<span class="luau-generic">T</span>&gt;(<span class="luau-parameter">value</span>: <span class="luau-generic">T</span>, <span class="luau-parameter">stamp</span>: <span class="luau-builtin">number</span>): <a class="luau-type" href="/api/inventory/#type-Stamped">Stamped</a>&lt;<span class="luau-generic">T</span>&gt;</code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L51">Source: Inventory.luau, line 51</a></p>

<a id="place" class="sl-luau-anchor"></a>

### `place`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-danger" data-status="not-faked" title="Calling it fails.">Not faked</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.place(<span class="luau-parameter">shape</span>: Shape.<a class="luau-type" href="/api/shape/#type-Shape">Shape</a>, <span class="luau-parameter">x</span>: <span class="luau-builtin">number</span>, <span class="luau-parameter">y</span>: <span class="luau-builtin">number</span>): <a class="luau-type" href="/api/inventory/#type-Placement">Placement</a></code></pre>

#### Examples

<details>
<summary>place records a shape at a point</summary>

```luau
local placement = Inventory.place(Shape.square(1), 4, 5)
t.equal(placement.at, { x = 4, y = 5 })
```

</details>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L57">Source: Inventory.luau, line 57</a></p>

<a id="split" class="sl-luau-anchor"></a>

### `split`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-danger" data-status="not-faked" title="Calling it fails.">Not faked</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.split(<span class="luau-parameter">text</span>: <span class="luau-builtin">string</span>, <span class="luau-parameter">separator</span>: <span class="luau-builtin">string</span>?): ...<span class="luau-builtin">string</span></code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L61">Source: Inventory.luau, line 61</a></p>

<a id="describe" class="sl-luau-anchor"></a>

### `describe`

<p class="sl-luau-status-line"><span class="sl-luau-status sl-luau-status-danger" data-status="not-faked" title="Calling it fails.">Not faked</span></p>

<pre class="sl-luau-signature"><code><span class="luau-keyword">function</span> Inventory.describe(
  <span class="luau-parameter">entry</span>: <span class="luau-builtin">string</span> | <span class="luau-builtin">number</span> | <span class="luau-builtin">boolean</span> | <span class="luau-builtin">nil</span>,
  <span class="luau-parameter">mode</span>: <span class="luau-string">&quot;short&quot;</span> | <span class="luau-string">&quot;long&quot;</span>
): <span class="luau-builtin">string</span></code></pre>

<p class="sl-luau-source"><a href="https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/Inventory.luau#L65">Source: Inventory.luau, line 65</a></p>
