import {DataObjectInstance} from "../types/executionState/DataObjectInstance";
import {ExecutionState} from "../types/executionState/ExecutionState";
import {Activity} from "../types/fragments/Activity";
import {IOSet} from "../types/fragments/IOSet";
import {DataObjectReference} from "../types/fragments/DataObjectReference";
import {Role} from "../types/Role";
import {Resource} from "../types/Resource";
import {Dataclass} from "../types/Dataclass";
import {InstanceLink} from "../types/executionState/InstanceLink";
import {Planner} from "../Planner";
import {Objective} from "../types/goal/Objective";
import {ObjectiveNode} from "../types/goal/ObjectiveNode";

// Dataclasses
const house = new Dataclass("house");
const wall = new Dataclass("wall");
const cable = new Dataclass("cable");

// Instances
const mapleStreetInit = new DataObjectInstance("house:1", house, "init");
const mapleStreetPainted = new DataObjectInstance("house:1", house, "painted");
const mapleStreetTiled = new DataObjectInstance("house:1", house, "tiled");
const mapleStreetPlastered = new DataObjectInstance("house:1", house, "plastered");

const wallNorthAvailable = new DataObjectInstance("wall:1", wall, "available");
const wallNorthStanding = new DataObjectInstance("wall:1", wall, "standing");
const wallSouthAvailable = new DataObjectInstance("wall:2", wall, "available");
const wallSouthStanding = new DataObjectInstance("wall:2", wall, "standing");

const redCableAvailable = new DataObjectInstance("cable:1", cable, "available");

// Instance links
const wallNorthMapleStreetLink = new InstanceLink(wallNorthStanding, mapleStreetPlastered);
const wallSouthMapleStreetLink = new InstanceLink(wallSouthStanding, mapleStreetPlastered);

// Roles
const painter = new Role("painter");
const tiler = new Role("tiler");
const electrician = new Role("electrician");
const builder = new Role("builder");

// Resources
const picasso = new Resource("Picasso", painter, 1);
const michelangelo = new Resource("Michelangelo", tiler, 1);
const tesla = new Resource("Tesla", electrician, 1);
const bob = new Resource("Bob", builder, 1);

// DataObjectReferences
const houseInit = new DataObjectReference(house, ["init"], false);
const housePainted = new DataObjectReference(house, ["painted"], false);
const housePlastered = new DataObjectReference(house, ["plastered"], false);
const houseTiled = new DataObjectReference(house, ["tiled"], false);
const cableAvailable = new DataObjectReference(cable, ["available"], false);
const wallAvailable = new DataObjectReference(wall, ["available"], true);
const wallStanding = new DataObjectReference(wall, ["standing"], true);

// IOSets
const inputSetPaint = new IOSet([houseInit]);
const outputSetPaint = new IOSet([housePainted]);

const inputSetPlaster = new IOSet([wallStanding]);
const outputSetPlaster = new IOSet([housePlastered]);

const inputSetPutWalls = new IOSet([wallAvailable]);
const outputSetPutWalls = new IOSet([wallStanding]);

const inputSetTile = new IOSet([housePainted]);
const outputSetTile = new IOSet([houseTiled]);

const inputSetLay = new IOSet([housePainted, cableAvailable]);
const outputSetLay = new IOSet([]);

const outputSetBuyCables = new IOSet([cableAvailable]);

// Activities
const paint = new Activity("paint", 1, 1, painter, [inputSetPaint], outputSetPaint);
const plaster = new Activity("plaster", 1, 1, painter, [inputSetPlaster], outputSetPlaster);
const putWalls = new Activity("putWalls", 1, 1, builder, [inputSetPutWalls], outputSetPutWalls);
const tile = new Activity("tile", 1, 1, tiler, [inputSetPaint, inputSetTile], outputSetTile);
const lay = new Activity("lay", 1, 1, electrician, [inputSetLay], outputSetLay);
const buyCables = new Activity("buyCables", 1, 1, electrician, [], outputSetBuyCables);

// ObjectiveNodes
const objectiveNode = new ObjectiveNode("house:1", house, ["painted"]);

// Objectives
const objective = new Objective([objectiveNode], []);



describe('determining executable Activities', () => {

    test('activity with one inputSet set should be executable', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);
        let activities = [paint];
        let ressources = [picasso];

        expect(currentState.executableActivities(activities, ressources)).toEqual([paint]);
    });

    test('activity with many inputSets sets should be executable', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);
        let activities = [paint, tile];
        let ressources = [picasso, michelangelo];

        expect(currentState.executableActivities(activities, ressources)).toEqual([paint, tile]);
    });

    test('activity with many data objects within one set should be executable', () => {
        let currentState = new ExecutionState([mapleStreetPainted, redCableAvailable], []);
        let activities = [paint, lay];
        let ressources = [picasso, tesla];

        expect(currentState.executableActivities(activities, ressources)).toEqual([lay]);
    });
});

describe('executing Activities', () => {

    test('activity with one inputSet is executable', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);

        paint.execute(currentState, [mapleStreetInit]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetPainted]);
    });

    test('activity with many inputSets is executable', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);

        tile.execute(currentState, [mapleStreetInit]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetTiled]);
    });

    test('activity that creates a new instance is executable', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);

        buyCables.execute(currentState, []);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetInit, redCableAvailable]);
    });

    test('activity that creates a new instance links the new instance to the input', () => {
        let currentState = new ExecutionState([wallNorthStanding, wallSouthStanding], []);

        plaster.execute(currentState, [wallNorthStanding, wallSouthStanding]);
        expect(currentState.dataObjectInstances).toEqual([wallNorthStanding, wallSouthStanding, mapleStreetPlastered]);
        expect(currentState.links).toEqual([wallNorthMapleStreetLink, wallSouthMapleStreetLink]);
    });

    test('activity with a list input is executable', () => {
        let currentState = new ExecutionState([mapleStreetInit, wallNorthAvailable, wallSouthAvailable], []);

        putWalls.execute(currentState, [wallNorthAvailable, wallSouthAvailable]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetInit, wallNorthStanding, wallSouthStanding]);
    });

    // Instances reset
    const mapleStreetInit = new DataObjectInstance("house:1", house, "init");
    const mapleStreetPainted = new DataObjectInstance("house:1", house, "painted");
    const mapleStreetTiled = new DataObjectInstance("house:1", house, "tiled");
    const mapleStreetPlastered = new DataObjectInstance("house:1", house, "plastered");

    const wallNorthAvailable = new DataObjectInstance("wall:1", wall, "available");
    const wallNorthStanding = new DataObjectInstance("wall:1", wall, "standing");
    const wallSouthAvailable = new DataObjectInstance("wall:2", wall, "available");
    const wallSouthStanding = new DataObjectInstance("wall:2", wall, "standing");
});

describe('generating plans', () => {

    let planner = new Planner();

    test('plan one activity', () => {
        let currentState = new ExecutionState([mapleStreetInit], []);

        expect(planner.simulateUntil(currentState, objective, [paint], [picasso])).toEqual(true);
    });
});