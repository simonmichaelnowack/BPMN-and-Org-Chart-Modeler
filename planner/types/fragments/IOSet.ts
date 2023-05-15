import {DataObjectReference} from "./DataObjectReference";
import {DataObjectInstance} from "../executionState/DataObjectInstance";

export class IOSet {
    set: DataObjectReference[];

    public constructor(set: DataObjectReference[]) {
        this.set = set;
    }

    public isSatisfiedBy(currentState: DataObjectInstance[]): boolean {
        let satisfiedBy = true;
        this.set.forEach(function (dataObjectReference) {
                let foundCorrespondingDataObjectInstance = false;
                currentState.forEach(function (dataObjectInstance) {
                        if (dataObjectInstance.dataclass == dataObjectReference.dataclass && dataObjectReference.states.includes(dataObjectInstance.state)){
                            foundCorrespondingDataObjectInstance = true;
                        }
                    }
                )
                if(!foundCorrespondingDataObjectInstance) {
                    satisfiedBy = false;
                }
            }
        );
        return satisfiedBy;
    }
}