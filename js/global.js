// Colors for different datatypes
const NODE_COLORS = {
    "null":    "#def",
    "boolean": "#fde",
    "int":     "#8ef",
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
var generatedJSON = null

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
        
        this.edgesTo   = []
        this.edgesFrom = []
        
        this.deleted = false
        
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
        <rect id="${this.id}" 
            x="${this.x}" y="${this.y}"
            fill="${color}" stroke="black" stroke-width="1px"
            width="128px", height="64px" 
            onmouseup="selectNode(${this.id})" 
            onmousedown="moveNode(${this.id})"
            ondblclick="changeSettings(${this.id})"
        />
        
        <text id="t${this.id}" x="${this.x}" y="${this.y}" class="name-label">
            ${this.name()}
        </text>

        <text id="d${this.id}" x="${this.x}" y="${this.y}" class="type-label">
            ${this.type}
        </text>
        

        <text id="v${this.id}" x="${this.x}" y="${this.y}" class="value-label">
            ${this.desc()}
        </text>
        `

        if (this.parent != null) {
            let edge_id = `e${this.id}_${this.parent.id}`
            this.edgesTo.push(edge_id)
            this.parent.edgesFrom.push(edge_id)
            area.innerHTML = `
                <line id="${edge_id}" 
                    x1="${this.parent.x}"
                    y1="${this.parent.y}"
                    x2="${this.x}" y2="${this.y}"
                    fill="${color}" stroke="black" stroke-width="1px"
                    onclick="selectNode(${this.id})" />
                ` + area.innerHTML
            
            this.parent.update()
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

        let textTarget = document.getElementById(`t${this.id}`)
        textTarget.x.baseVal[0].value = this.x
        textTarget.y.baseVal[0].value = this.y
        textTarget.innerHTML = this.name()

        let typeTarget = document.getElementById(`d${this.id}`)
        typeTarget.x.baseVal[0].value = this.x
        typeTarget.y.baseVal[0].value = this.y

        let valTarget = document.getElementById(`v${this.id}`)
        valTarget.x.baseVal[0].value = this.x
        valTarget.y.baseVal[0].value = this.y
        valTarget.innerHTML = this.desc()

        this.edgesTo.forEach(edge_id => {
            let edge = document.querySelector(`#${edge_id}`)
            edge.x2.baseVal.value = this.x
            edge.y2.baseVal.value = this.y
        })

        this.edgesFrom.forEach(edge_id => {
            let edge = document.querySelector(`#${edge_id}`)
            edge.x1.baseVal.value = this.x
            edge.y1.baseVal.value = this.y
        })
    }

    name() {
        if (this.parent == null) { return "--root--" }
        if (this.parent.type == "object") { 
            let key = this.key 
            if (key.length > 14) {
                let lastChar = key[key.length - 1]
                return key.slice(0, 11) + "..." + lastChar
            }
            return key
        }
        if (this.parent.type == "array")  { return `index ${this.key}` }
        return "--error--"
    }

    desc() {
        let isStr   = this.type == "string"
        let isInt   = this.type == "int"
        let isFloat = this.type == "float"
        let isNull  = this.type == "null"
        let isBool  = this.type == "boolean"
        let simpleType = isStr || isInt || isFloat || isNull || isBool

        if (simpleType) {
            let strValue = `${this.value}`
            if (this.type == "string") {
                strValue = `"${strValue}"`
            }

            if (strValue.length > 14) {
                let lastChar = strValue[strValue.length - 1]
                return strValue.slice(0, 11) + "..." + lastChar
            }
            return strValue
        }

        if (this.type == "array") { 
            return `${this.value.length} elements` 
        }

        if (this.type == "object") {
            let count = 0
            for (let key in this.value) { count += 1 }
            return `${count} keys`
        }
    }

    isLeaf() {
        if (this.type == "array")  { return false }
        if (this.type == "object") { return false }
        return true
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