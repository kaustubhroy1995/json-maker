// Colors for different datatypes
const NODE_COLORS = {
    "null":    "#def",
    "boolean": "#fde",
    "int":     "#8fd",
    "float":   "#8df",
    "string":  "#fd6",
    "array":   "#ff8",
    "object":  "#6fa"
}

// Mouse location object
const mouse = { x: 0, y: 0 }

// Handle for the rendering area and the generated JSON
var area = null
var output = null

// Current JSON tree, as generated by output
const generatedJSON = {}

// Current tree of drag-and-drop objects created
const createdObjects = []

// Class for representing objects built with drag and drop
class DndNode {
    constructor(parent, type, key, value) {
        this.parent = parent
        this.type   = type
        this.key    = key
        this.value  = value
        
        this.x = mouse.x
        this.y = mouse.y
        this.selected = false
        
        if (this.parent != null) {
            if (this.parent.type == "object") {
                // If parent is an object, map the assigned key to this object
                this.parent.value[key] = this
            } 
            
            if (this.parent.type == "array") {
                // If parent is an array, push this element into it
                this.key = this.parent.value.length
                this.parent.value.push(this)
            }
        }

        if (this.type == "object") { this.value = {} }
        if (this.type == "array")  { this.value = [] }
        
        this.id = createdObjects.length
        createdObjects.push(this)
        this.render()
    }

    render() {
        let color = NODE_COLORS[this.type]

        area.innerHTML += `
        <rect id="${this.id}" x="${this.x}" y="${this.y}"
              fill="${color}" stroke="black" stroke-width="1px"
              width="128px", height="64px" 
              onclick="selectNode(${this.id})" />
        `

        if (this.parent != null) {
            area.innerHTML = `
                <line id="${this.id}_${this.parent.id}" 
                    x1="${this.parent.x}"
                    y1="${this.parent.y}"
                    x2="${this.x}" y2="${this.y}"
                    fill="${color}" stroke="black" stroke-width="1px"
                    onclick="selectNode(${this.id})" />
                ` + area.innerHTML
        }
    }

    update() {
        let target = document.getElementById(`${this.id}`)
        target.x.baseVal.value = this.x
        target.y.baseVal.value = this.y

        if (this.selected) {
            target.style.stroke = "blue"
            target.style.strokeWidth = "2px"
        }

        else {
            target.style.stroke = "black"
            target.style.strokeWidth = "1px"
        }
    }
}

// Interactive state is the state associated with what exactly a click is
// supposed to do now - should it place a component in the interactive
// region, or should it select the item clicked upon
interactiveState = {
    // Available options for `type` are:
    //    select: Select whichever block is clicked on
    //    place:  Place a component where the click occurs
    //    change: A node has already been selected, now modify it
    //    drag:   Dragging, for moving a node
    "type":   "select",
    "target": "none"
}
