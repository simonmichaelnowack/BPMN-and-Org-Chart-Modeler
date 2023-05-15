import {Dataclass} from "../Dataclass";

export class ObjectiveNode {
    name: string;
    dataclass: Dataclass;
    states: string[];

    public constructor(name: string, dataclass: Dataclass, states: string[]) {
        this.name = name;
        this.dataclass = dataclass;
        this.states = states;
    }
}