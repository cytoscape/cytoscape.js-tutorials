---
layout: post
title: Visualizing Glycolysis with Cytoscape.js
subtitle: Creating an animated flowchart for glycolysis
tags:
- tutorial
---

This is the second in a series of tutorials by [Joseph Stahl](https://josephstahl.com/) about [Cytoscape.js](http://js.cytoscape.org).
The [first post]({% post_url 2016-05-24-getting-started %}) covers creating a 2-node graph with Cytoscape.js and is recommended reading for those unfamiliar with the software.

# Getting ready

## A container for the graph: `index.html`
As before, Cytoscape.js requires an area to draw the graph. A simple `index.html` will get us started.
CSS will again be inline with the HTML to keep things simple.
A full-window graph is used to provide the glycolysis graph with as much space as possible for molecule structures. 

```html
<!doctype html>
<html>
<head>
    <title>Tutorial 2: Glycolysis</title>
    <script src='cytoscape.js'></script>
</head>

<style>
    #cy {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
    }
</style>

<body>
    <div id="cy"></div>
</body>
</html>
```

## A list of elements: `gly_elements.js`
In the interest of keeping different parts of code separate, the steps of glycolysis will be specified in `gly_elements.js` while the graph-related code will be in `glycolysis.js`.
Modify the `<head>` section of `index.html` to include these two files:

```html
<head>
    <title>Tutorial 2: Glycolysis</title>
    <script src='cytoscape.js'></script>
    <script src='gly_elements.js'></script>
    <script src='glycolysis.js'></script>
</head>
```

`gly_elements.js` is a list of the molecules involved in glycolysis.
Because the file is lengthy and repetitive, I will only be including an excerpt in the tutorial; however, the [full source is available for download and review]({{site.baseurl}}/public/demos/glycolysis/gly_elements.js).
Each intermediate metabolite will be a node of the graph.
The enzymes that convert each metabolite to the next intermediate will be the edges connecting nodes.

Nodes have three `data` properties:

- `id`: a unique ID given to the node; in this case, IDs are incrementing integers—good for representing an incremental process such as metabolism.
  Metabolite names are not used here (despite being unique) because they complicate comparison; there's no good way to tell that
  G6P is "greater than" (comes after) glucose without relying on analyzing edges. 
- `molecule`: the name of the metabolite
- `image`: a line-drawing image of the metabolite; displaying these images will be covered later

Edges have four `data` properties:

- `id`: again, IDs are unique incrementing strings, with the exception of `step5-reverse` which is named such to preserve the ordering found on [the Glycolysis Wikipedia article](https://en.wikipedia.org/wiki/Glycolysis)
- `enzyme`: the name of the enzyme involved in each reaction. This will be used to display names on edges
- `source`: in chemistry terms, the reactant
- `target`: in chemistry terms, the product. Edges go from `source` to `target` much as chemical reactions proceed from reactants to products

```javascript
// based on https://en.wikipedia.org/wiki/Glycolysis

var GlyElements = {
  nodes: [
    { data: { id: 0, molecule: 'Glucose', image: 'glucose.svg' } },
    { data: { id: 1, molecule: 'G6P', image: 'g6p.svg' } },
    { data: { id: 2, molecule: 'F6P', image: 'f6p.svg' } },
    { data: { id: 3, molecule: 'F1,6BP', image: 'f16bp.svg' } },
    // GADP & DHAP is in equilibrium
    { data: { id: 4, molecule: 'GADP', image: 'gadp.svg' } },
    { data: { id: 5, molecule: 'DHAP', image: 'dhap.svg' } }, 
    { data: { id: 6, molecule: '1,3BPG', image: '13bpg.svg' } }
    // Remaining data excluded for brevity
  ],
  edges: [
    { data: { id: 'step1', enzyme: 'Hexokinase', source: 0, target: 1 } },
    { data: { id: 'step2', enzyme: 'Phosphoglucose isomerase', source: 1, target: 2 } },
    { data: { id: 'step3', enzyme: 'Phosphofructokinase', source: 2, target: 3 } },
    { data: { id: 'step4', enzyme: 'Fructose-bisphosphate aldolase', source: 3, target: 4 } },
    { data: { id: 'step5', enzyme: 'Triosephosphate isomerase', source: 4, target: 5 } },
    // DHAP is in equilibrium with GADP; only GADP moves pathway forward
    { data: { id: 'step5-reverse', enzyme: 'Triosephosphate isomerase', source: 5, target: 4 } },
    { data: { id: 'step6', enzyme: 'Glyceraldehyde 3-phosphate dehydrogenase',
        // 4 is GADP, 5 is DHAP and is therefore skipped over
        source: 4,
        target: 6 } }
    // Remaining data excluded for brevity
  ]
};
```

This will create a variable, `GlyElements`, which is accessible within `glycolysis.js`, saving us the effort of specifying each step as elements when initializing a Cytoscape.js graph.
One can see on [the Wikipedia page for glycolysis](https://en.wikipedia.org/wiki/Glycolysis) that Step 4 produces a mixture of two products but only GADP moves forward in Step 6.
Because of this, edges are specified manually; connecting each node *i* to *i+1* via a for-loop would not be accurate.

At this point, the workspace should be structured as follows, with `glycolysis.js` currently existing as an empty placeholder file.

```
glycolysis/
    +-- cytoscape.js
    +-- gly_elements.js
    +-- glycolysis.js
    +-- index.html
```

# Making the graph: `glycolysis.js`

## Waiting for `<div>`: Ensuring `cytoscape.js` has a container to use
[Last time]({% post_url 2016-05-24-getting-started %}), it was possible to place `var cy = cytoscape({...})` after the `<div>` element to make sure that the graph had a container to use.
Because of putting `<script src='glycolysis.js'></script>` in `<head>`, ordering will not work this time.
Instead, using an event listener will make sure that no graph-related code is run before the DOM has finished being laid out.
Add `document.addEventListener` to the top of the file, as follows: 

```javscript
document.addEventListener("DOMContentLoaded", function() { ... });
```

All remaining code will go inside of the anonymous function (which will be executed once the DOM layout is finished).

## An empty graph
Now that we are sure there is a `<div>` element to draw within, it's time to call `cytoscape()`.

```javascript
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          label: 'data(molecule)'
        }
      }, {
        selector: 'edge',
        style: {
          label: 'data(enzyme)'
        }
      }
    ]
  });
```

Remember that this will all be indented within the function. As done previously, the graph will be created within the `cy` element.
The object passed to `cytoscape()` also contains some style directives for the graph.
In [getting-started]({% post_url 2016-05-24-getting-started %}), the `id` property was used for labels; now, `molecule` will be used to provide more descriptive names.
Edges are given labels in the same manner as nodes: specify that a style is being applied to them via a [selector](http://js.cytoscape.org/#selectors) then provide properties as a `style` object.
Currently, only a `label` style is applied so that viewers of the graph can tell what enzyme is involved in each step.

Unlike the Getting Started example, no elements are specified during initialization of the graph (and consequently no layout, since there are no elements to lay out).
These will be added later by using the `GlyElements` object defined earlier.

## Populating the graph
Due to previously specifying a JSON object (recall `GlyElements`?), adding elements to this graph is extraordinarily easy.
Add the following right underneath `var cy = cytoscape({...})`:

```javascript
  cy.add(GlyElements);
```

Easy, right? Now that elements have been added, it's time to style them. The following code directly follows `cy.add(GlyElements)`.

```javascript
  cy.nodes().forEach(function(ele) {
    cy.style().selector('#' + ele.id())
      .style({
        'width': 200,
        'height': 200,
        'background-opacity': 0,
        'background-image': 'assets/' + ele.data().image,
        'background-fit': 'contain',
        'background-clip': 'none'
      })
      .update();
  });
```

[`cy.nodes().forEach(function);`](http://js.cytoscape.org/#eles.forEach) will apply a function to each node of the graph—useful since we have to modify each node's `background-image` property, among others.
`cy.nodes()` is a quick way to get an array of all nodes of the graph.
`forEach()` provides `ele`, `i`, and `eles` to the passed function. In this case, only `ele` is used because styling is node-specific and does not require knowledge of the index of the node (`i`) or information about the other nodes (`eles`).

`forEach()` is passed an anonymous function which will modify the style of each element.
The function is a long chain of function calls which select nodes, modify their style, and update the graph with the newly styled nodes.
[`cy.style()`](http://js.cytoscape.org/#cy.style) returns a style object for the entire graph.
Since only the style of a single node will be modified at a time, a [selector](http://js.cytoscape.org/#selectors) call is chained next.
Selectors use a [CSS-esque string for selecting elements, detailed in the Cytoscape.js documentation](http://js.cytoscape.org/#selectors/notes-amp-caveats).
`'#' + ele.id()` will select individual elements to ensure that an image is only applied to that element.
The [`'#'` character](http://js.cytoscape.org/#selectors/group-class-amp-id) tells the `selector()` function that it will be matching elements based on ID.
String concatenation is used to join `'#'` with `ele.id()` (recall that `ele` is passed to this function via `forEach()`) to form the completed selector string.

At this point, the graph's style object has been narrowed down to the style referring to a single element.
Now it is time to modify that style.
`style()` is again called, this time to get the style of the single object provided by the selector.
Unlike last time, a new style is provided via the object passed to `style()`.

- [`'width'` and `'height'`](http://js.cytoscape.org/#style/node-body) properties make each node 200px wide—large enough to hold the images.
- [`'background-opacity'`](http://js.cytoscape.org/#style/node-body) makes the back of the node transparent instead of the usual gray color.
- [`'background-image'`, `'background-fit'`, and `'background-clip'`](http://js.cytoscape.org/#style/background-image) all refer to the background images being used (the metabolite SVGs).
  - `'background-image': 'assets/' + ele.data().image` concatenates `assets/` (the folder where the SVG images are stored) with the image filename previously specified in `gly_elements.js`.
  [ele.data()](http://js.cytoscape.org/#eles.data) provides an easy way to access the data of an element; in this case, the `image` value is retrieved.
  - `'background-fit: 'contain'` shrinks the images as needed to fit within the 200px nodes
  - `'background-clip': 'none'` ensures that images that square images within round nodes are not cropped. Alternatively, node shaped could be changed to `square` when initializing the graph.

Finally, a call to `update()` is made to complete applying the new style to each element.

*Note: styling the elements requires adding SVG elements which for this tutorial are written as relative URLs.
To view images, you will likely need to point a webserver at the `glycolysis` directory (or whichever directory contains your work for this tutorial).
Alternatively, you may change `'background-image': 'assets/' + ele.data().image'` to `'background-image': 'http://blog.js.cytoscape.org/public/demos/glycolysis/assets/' + ele.data().image` to use the SVGs hosted on Github Pages.*

If using images stored locally, [download the SVGs here]({{site.baseurl}}/public/demos/glycolysis/assets/assets.zip).
Unzip and make sure that your workspace is organized as follows: 

```
glycolysis/
    +-- assets/
    |   +-- 13bpg.svg
    |   +-- 2pg.svg
    |   +-- 3pg.svg
    |   +-- dhap.svg
    |   +-- f16bp.svg
    |   +-- f6p.svg
    |   +-- g6p.svg
    |   +-- gadp.svg
    |   +-- glucose.svg
    |   +-- pep.svg
    |   +-- pyruvate.svg
    +-- cytoscape.js
    +-- gly_elements.js
    +-- glycolysis.js
    +-- index.html
```

## Laying out the graph
Now that all nodes are added and have images, it's time to lay out the graph.
Order is important here to make sure that all intermediate metabolites are laid out in the right order.

We'll start with a [`grid` layout](http://js.cytoscape.org/#layouts/grid).

```javascript
 cy.layout({
    name: 'grid'
 });
```
 
However, at this point the graph looks crowded and hard to read.
Some other options should be specified to get a better looking layout.

```javascript
  cy.layout({
    name: 'grid',
    fit: false,
    columns: 1,
    avoidOverlap: true,
    avoidOverlapPadding: 80
  });
```

This will produce a better looking graph where all the intermediates are lined up vertically with enough padding between nodes to read enzyme names on the edges.

- `fit: false` stops Cytoscape.js from trying to fit the entire graph on one screen. With the molecule images, it's best to keep them large and well-spaced and scroll down if necessary.
- `columns: 1` lines all elements up vertically. This will be useful later when scrolling the viewport.
- `avoidOverlap: true` prevents images from overlapping and allows us to use `avoidOverlapPadding`
- `avoidOverlapPadding: 80` puts 80 pixels between each node, giving enough space to read the enzyme names depicted on edges

There is still one problem though: DHAP is not put in the proper location.
Since only one column is available to Cytoscape.js, it places DHAP underneath GADP which results in the edge from GADP going underneath DHAP to get to 1,3BPG.
To fix this, we'll create two columns in the graph but place everything except DHAP in the left-hand column.
This way, DHAP will stick out to the right, making it easy to recognize that DHAP is in equilibrium with GADP and not a predecessor of 1,3BPG.

To create this layout, modify the object passed to `cy.layout()` slightly.

```javascript
  cy.layout({
    name: 'grid',
    fit: false, // it's okay if some of the graph is hidden off-screen because viewport scrolls
    columns: 2,
    avoidOverlap: true,
    avoidOverlapPadding: 80,
    position: function(ele) {
      if (ele.data().molecule === 'DHAP') {
        // DHAP is, as usual, a special case
        return { row: ele.id(), col: 1 }; // layout to right of GADP
      }
      return { row: ele.id(), col: 0 };
    }
  });
```

As noted previously, `columns` has been bumped up to 2.
Additionally, the `position` property is now specified.
The value of `position` is a function which returns a `{ row: x, col: y}` type object, where `x` and `y` are grid coordinates for the object.
The most straightforward way to handle DHAP is to examine the name of the molecule currently being laid out.
This is retrieved the same way as the image filename, with `ele.data().molecule`.
If the node's molecule name is 'DHAP', it's put in the second column; otherwise, the first column.
All nodes are put in rows matching their ID—another advantage to using incrementing integers for IDs.

Finally, let's [lock the elements](http://js.cytoscape.org/#nodes.lock) to make sure that users don't mess up our careful layout!

```javascript
  cy.nodes().lock();
```

This will lock the graph in the current layout, preventing users from dragging nodes around (but not from scrolling the viewpoint).

**Congratulations, you've made a glycolysis graph! It should look similar to this:**

![Graph before adding animation button]({{site.baseurl}}/public/demos/glycolysis/assets/graph_before_button.png)