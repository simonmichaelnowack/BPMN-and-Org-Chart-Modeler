import {ObjectiveNode} from "./ObjectiveNode";
import {NodeLink} from "./NodeLink";

export class Objective {
    dataObjectNodes: ObjectiveNode[];
    instanceLinks: NodeLink[]; // Change naming
    deadline: number | null;

    public constructor(dataObjectNodes: ObjectiveNode[], links: NodeLink[], deadline: number | null = null) {
        this.dataObjectNodes = dataObjectNodes;
        this.instanceLinks = links;
        this.deadline = deadline;
    }
}