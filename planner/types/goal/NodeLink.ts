import {ObjectiveNode} from "./ObjectiveNode";

export class NodeLink {
    first: ObjectiveNode;
    second: ObjectiveNode;

    public constructor(first: ObjectiveNode, second: ObjectiveNode) {
        this.first = first;
        this.second = second;
    }
}