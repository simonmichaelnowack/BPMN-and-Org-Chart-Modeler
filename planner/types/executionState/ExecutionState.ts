import {Activity} from "../fragments/Activity";
import {Resource} from "../Resource";
import {DataObjectInstance} from "./DataObjectInstance";
import {InstanceLink} from "./InstanceLink";
import {Dataclass} from "../Dataclass";

export class ExecutionState {
    dataObjectInstances: DataObjectInstance[];
    links: InstanceLink[];

    public constructor(dataObjects: DataObjectInstance[], links: InstanceLink[]) {
        this.dataObjectInstances = dataObjects;
        this.links = links;
    }

    public executableActivities(activities: Activity[], resources: Resource[]): Activity[] {
        return activities.filter(activity => activity.isExecutable(this.dataObjectInstances, resources));
    }

    public getDataObjectInstanceOfClass(dataclass: Dataclass): DataObjectInstance[] {
        return this.dataObjectInstances.filter(DataObjectInstance => DataObjectInstance.dataclass === dataclass);
    }

    // public executeActiviy(activitiy: Activity, instance: DataObjectInstance) {
    //     let indexInInstances = this.dataObjectInstances.indexOf(instance);
    //     let indexInOutput = activitiy.outputSet.map(element => element.dataclass).indexOf(instance.state[0].dataclass);
    //     if (indexInOutput === -1) {
    //         console.error("This Activity does not change the state of this instance.")
    //     }
    //     if (indexInInstances === -1) {
    //         console.error("This instance does not exist at the current state.")
    //     }
    //     this.dataObjectInstances[indexInInstances].state.splice(indexInInstances, 1, activitiy.outputSet[indexInOutput]);
    // }
}