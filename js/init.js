function readyDndArea() {
    area = document.querySelector("#constructionArea")
    output = document.querySelector("#jsonCode")

    area.addEventListener("mousemove", function (event) {
        mouse.x = event.offsetX
        mouse.y = event.offsetY
        
        let hoverNode = document.querySelector("#hoverNode")
        if (interactiveState.type == "place") {
            if (hoverNode.style.visibility != "visible") {
                hoverNode.style.visibility = "visible"
            }
            hoverNode.x.baseVal.value  = mouse.x
            hoverNode.y.baseVal.value  = mouse.y
        }
        else {
            hoverNode.style.visibility = "hidden"
        }

        if (interactiveState.type == "move") {
            let target = interactiveState.target
            target.node.x = mouse.x + target.xoff
            target.node.y = mouse.y + target.yoff
            target.node.update()
        }
    } )

    let rootObject = new DndNode(null, "object", null, {})
    rootObject.x = area.width.baseVal.value  / 2
    rootObject.y = area.height.baseVal.value / 2
    rootObject.update()

    loadState()
}
