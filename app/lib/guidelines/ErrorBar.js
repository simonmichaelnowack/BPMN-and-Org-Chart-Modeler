export default class ErrorBar {
    constructor(element, mediator) {
        this.element = element;
        this.mediator = mediator;
        makeResizable(element);
        this.table = document.getElementById('errorTable');
        this.toggleTableButton = document.getElementById('toggleErrorTable');
        this.toggleTableButton.addEventListener('click', event => {
            this.toggleTable();
        });
        this.numberOfViolations = document.getElementById('numberOfViolations');
    }

    clear() {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
        this.numberOfViolations.innerHTML = '';
    }

    displayRow({ severity, element, artifact, message, link, quickFixes }) {
        const row = this.table.insertRow(-1);
        row.addEventListener('dblclick', event => {
            this.mediator.focusElement(element);
        });
        row.classList.add(severity.cssClass);
        row.classList.add('violationRow');
        const elementCell = row.insertCell(-1), artifactCell = row.insertCell(-1), messageCell = row.insertCell(-1), linkCell = row.insertCell(-1), quickFixesCell = row.insertCell(-1);
        elementCell.innerHTML = element.name;
        artifactCell.innerHTML = artifact;
        messageCell.innerHTML = message;
        const linkElement = document.createElement('a');
        linkElement.href = link;
        linkElement.target = '_blank';
        linkElement.innerHTML = '❓';
        linkCell.appendChild(linkElement);
        if (quickFixes && quickFixes.length > 0) {
            const quickFixesButton = document.createElement('button');
            quickFixesButton.innerHTML = '💡';
            quickFixesCell.appendChild(quickFixesButton);
            quickFixesButton.addEventListener('click', event => {
                this.makeQuickFixDiv(event, this.element, element, quickFixes)
            });
            quickFixesButton.addEventListener('dblclick', event => {
                event.stopPropagation();
            });
        }
    }

    toggleTable() {
        this.element.classList.toggle('hidingTable');
    }

    displayNumberOfViolations(severity, number){
        const display = document.createElement('span');
        display.innerHTML = severity.label + ': ' + number;
        display.classList.add('barButton');
        this.numberOfViolations.appendChild(display);
        return display;
    }

    makeQuickFixDiv(event, parent, element, quickFixes) {
        const quickFixDiv = document.createElement('div');
        quickFixDiv.close = () => {
            quickFixDiv.parentElement?.removeChild(quickFixDiv);
            document.removeEventListener('click', quickFixDiv.close, true);
        }
        const quickFixTable = document.createElement('table');
        quickFixes.forEach(quickFix => {
            const quickFixRow = quickFixTable.insertRow(-1);
            const cell = quickFixRow.insertCell(-1);
            cell.innerHTML = quickFix.label;
            cell.addEventListener('click', event => {
                this.mediator.focusElement(element); // TODO the only 'this' reference in here
                quickFix.action();
                event.stopPropagation();
                quickFixDiv.close();
            });
            cell.style.cursor = 'pointer';
        });
    
        quickFixDiv.style.background = 'gray';
        quickFixDiv.style.position = 'absolute';
        quickFixTable.classList.add('errorTable');
        quickFixTable.style.margin = '0';
    
        quickFixDiv.appendChild(quickFixTable);
        parent.appendChild(quickFixDiv);
        quickFixDiv.style.left = event.x + 'px';
        quickFixDiv.style.top = event.y + 'px';
        event.stopPropagation();
    
        document.addEventListener('click', quickFixDiv.close, true);
    }
}



function makeResizable(elmnt) {

    // TODO now we have two kinds of code for resizing: dividers and this here

    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // get the mouse cursor position at startup:
        //pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        if (elmnt.classList.contains('hidingTable')) return;

        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        //pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        //pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        //elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.height = elmnt.offsetHeight + pos2 + "px";
        //mainContent.style.height = mainContent.offsetHeight - pos2 + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}