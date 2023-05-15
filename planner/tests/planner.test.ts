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

// Dataclasses
let house = new Dataclass("house");
let wall = new Dataclass("wall");
let cable = new Dataclass("cable");

// Instances
let mapleStreetInit = new DataObjectInstance("house:1", house, "init");
let mapleStreetPainted = new DataObjectInstance("house:1", house, "painted");
let mapleStreetTiled = new DataObjectInstance("house:1", house, "tiled");
let mapleStreetPlastered = new DataObjectInstance("house:1", house, "plastered");

let wallNorthAvailable = new DataObjectInstance("wall:1", wall, "available");
let wallNorthStanding = new DataObjectInstance("wall:1", wall, "standing");
let wallSouthAvailable = new DataObjectInstance("wall:2", wall, "available");
let wallSouthStanding = new DataObjectInstance("wall:2", wall, "standing");

let redCableAvailable = new DataObjectInstance("cable:1", cable, "available");

// Instance links

let wallNorthMapleStreetLink = new InstanceLink(wallNorthStanding,mapleStreetPlastered);
let wallSouthMapleStreetLink = new InstanceLink(wallSouthStanding,mapleStreetPlastered);

// Roles
let painter = new Role("painter");
let tiler = new Role("tiler");
let electrician = new Role("electrician");
let builder = new Role("builder");

// Resources
let picasso = new Resource("Picasso", painter, 1);
let michelangelo = new Resource("Michelangelo", tiler, 1);
let tesla = new Resource("Tesla", electrician, 1);
let bob = new Resource("Bob",builder,1);

// DataObjectReferences
let houseInit = new DataObjectReference(house,["init"],false);
let housePainted = new DataObjectReference(house,["painted"], false);
let housePlastered = new DataObjectReference(house,["plastered"], false);
let houseTiled = new DataObjectReference(house,["tiled"], false);
let cableAvailable = new DataObjectReference( cable,["available"],false);
let wallAvailable = new DataObjectReference(wall,["available"],true);
let wallStanding = new DataObjectReference(wall,["standing"],true);

// IOSets
let inputSetPaint = new IOSet([houseInit]);
let outputSetPaint = new IOSet([housePainted]);

let inputSetPlaster = new IOSet([wallStanding]);
let outputSetPlaster = new IOSet([housePlastered]);

let inputSetPutWalls = new IOSet([wallAvailable]);
let outputSetPutWalls = new IOSet([wallStanding]);

let inputSetTile = new IOSet([housePainted]);
let outputSetTile = new IOSet([houseTiled]);

let inputSetLay = new IOSet([housePainted, cableAvailable]);
let outputSetLay = new IOSet([]);



let outputSetBuyCables = new IOSet([cableAvailable]);

// Activities
let paint = new Activity("paint", 1, 1, painter, [inputSetPaint], outputSetPaint);
let plaster = new Activity("plaster", 1, 1, painter, [inputSetPlaster], outputSetPlaster);
let putWalls = new Activity("putWalls", 1, 1, builder, [inputSetPutWalls], outputSetPutWalls);
let tile = new Activity("tile", 1, 1, tiler, [inputSetPaint, inputSetTile], outputSetTile);
let lay = new Activity("lay", 1, 1, electrician, [inputSetLay], outputSetLay);
let buyCables = new Activity("buyCables", 1, 1, electrician, [], outputSetBuyCables);

// Project State
let activities: Activity[] = [paint];
let ressources: Resource[] = [picasso];
let currentState = new ExecutionState([mapleStreetInit], []);


describe('determining executable Activities', () => {

    test('activity with one inputSet set should be executable', () => {
        expect(currentState.executableActivities(activities, ressources)).toEqual([paint]);
    });

    test('activity with many inputSets sets should be executable', () => {
        activities = [paint, tile];
        ressources = [picasso, michelangelo];
        expect(currentState.executableActivities(activities, ressources)).toEqual([paint, tile]);
    });

    test('activity with many data objects within one set should be executable', () => {
        activities = [paint, lay];
        ressources = [picasso, tesla];
        currentState.dataObjectInstances = [mapleStreetPainted, redCableAvailable];
        expect(currentState.executableActivities(activities, ressources)).toEqual([lay]);
    });
});

describe('executing Activities', () => {

    test('activity with one inputSet is executable', () => {
        currentState.dataObjectInstances = [mapleStreetInit];
        paint.execute(currentState,[mapleStreetInit]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetPainted]);
    });

    test('activity with many inputSets is executable', () => {
        currentState.dataObjectInstances = [mapleStreetInit];
        tile.execute(currentState,[mapleStreetInit]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetTiled]);
    });

    test('activity that creates a new instance is executable', () => {
        currentState.dataObjectInstances = [mapleStreetInit];
        buyCables.execute(currentState,[]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetInit, redCableAvailable]);
    });

    test('activity that creates a new instance links the new instance to the input', () => {
        currentState.dataObjectInstances = [wallNorthStanding,wallSouthStanding];
        plaster.execute(currentState,[wallNorthStanding,wallSouthStanding]);
        expect(currentState.dataObjectInstances).toEqual([wallNorthStanding,wallSouthStanding, mapleStreetPlastered]);
        expect(currentState.links).toEqual([wallNorthMapleStreetLink,wallSouthMapleStreetLink]);
    });

    test('activity with a list input is executable', () => {
        currentState.dataObjectInstances = [mapleStreetInit,wallNorthAvailable,wallSouthAvailable];
        putWalls.execute(currentState,[wallNorthAvailable,wallSouthAvailable]);
        expect(currentState.dataObjectInstances).toEqual([mapleStreetInit, wallNorthStanding, wallSouthStanding]);
    });
});

describe('generating plans', () => {

    let planner = new Planner();

    test('activity with one inputSet is executable', () => {
        currentState.dataObjectInstances = [mapleStreetInit];
        expect(planner.simulateUntil(currentState,[mapleStreetTiled],[paint,tile],[picasso,michelangelo])).toEqual(true);
    });
});